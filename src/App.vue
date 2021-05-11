<template>
  <v-app>
    <v-main class="pa-8" v-if="storeReady">
      <p class="display-1 d-flex">
        <span class="flex-grow-1"> Configuration </span>
        <v-btn @click="refreshStore()">
          <v-icon> mdi-refresh </v-icon>
        </v-btn>
      </p>
      <v-text-field
        :value="minerPath"
        @change="minerPath = $event"
        label="Path to miner executable"
        filled
        prepend-icon="mdi-pickaxe"
        append-icon="mdi-folder-open"
        :rules="[required]"
        @click:append="pickPath('minerPath')"
      />
      <v-text-field
        label="Start Command (optional)"
        :value="startCmd"
        @change="startCmd = $event"
        filled
        prepend-icon="mdi-console-line"
        append-icon="mdi-folder-open"
        @click:append="pickPath('startCmd')"
      />
      <MinerController />
      <v-divider class="my-4" />
      <ResetSettings />
    </v-main>
    <v-footer padless>
      <v-col class="text-center" cols="12">
        <a @click="openGithub">GitHub</a>
        -
        {{ version }} {{ channel ? `(${channel})` : '' }}
      </v-col>
    </v-footer>
  </v-app>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from '@vue/composition-api';
import {
  useRemoteStoreProp,
  refreshStore,
  useIpcRendererChannel,
} from './util';
import { ResetSettings } from './components/ResetSettings.vue';
import { MinerController } from './components/MinerController.vue';

export default defineComponent({
  name: 'App',
  components: {
    ResetSettings,
    MinerController,
  },
  setup() {
    const minerPath = useRemoteStoreProp('minerPath');
    const startCmd = useRemoteStoreProp('startCmd');
    refreshStore();

    const { send: sendPickPath } = useIpcRendererChannel(
      'pick-path',
      (event, pathId, result) => {
        switch (pathId) {
          case 'minerPath':
            minerPath.value = result.filePaths[0] || '';
            break;
          case 'startCmd':
            startCmd.value = result.filePaths[0] || '';
            break;
          default:
            return;
        }
      }
    );

    const version = ref('');
    const channel = ref('');
    const { send: sendGetVersion } = useIpcRendererChannel(
      'get-version',
      (event, versionReply, channelReply) => {
        version.value = versionReply;
        channel.value = channelReply;
      }
    );
    sendGetVersion();

    useIpcRendererChannel('server-error', (event, error) => {
      // TODO handle
    });

    const { send: sendOpenGithub } = useIpcRendererChannel('open-github');

    return {
      refreshStore,
      storeReady: computed(() => minerPath.value !== null),
      minerPath,
      startCmd,
      version,
      channel,
      openGithub() {
        sendOpenGithub();
      },
      pickPath(pathId: string) {
        sendPickPath(pathId, {
          title: 'Set the file path to the miner executable',
          properties: ['openFile'],
          filters: [
            {
              name: 'Executable',
              extensions: ['exe', 'bat'],
            },
          ],
        });
      },
      required: (val: string | null) =>
        val && val.length > 0 ? true : 'Required',
    };
  },
});
</script>
