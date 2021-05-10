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
        @click:append="pickMinerPath"
      />
      <v-text-field
        label="Miner CLI args (optional)"
        :value="minerArgs"
        @change="minerArgs = ($event || '').split(' ')"
        filled
        prepend-icon="mdi-console-line"
      />
      <MinerController />
      <v-divider class="my-4" />
      <ResetSettings />
    </v-main>
  </v-app>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
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
    const minerArgs = useRemoteStoreProp('minerArgs');
    refreshStore();

    const { send: sendPickPath } = useIpcRendererChannel(
      'pick-path',
      (event, pathId, result) => {
        switch (pathId) {
          case 'minerPath':
            minerPath.value = result.filePaths[0] || '';
            break;
          default:
            return;
        }
      }
    );

    useIpcRendererChannel('server-error', (event, error) => {
      // TODO handle
    });

    return {
      refreshStore,
      storeReady: computed(() => minerPath.value !== null),
      minerPath,
      minerArgs,
      pickMinerPath() {
        sendPickPath('minerPath', {
          title: 'Set the file path to the miner executable',
          properties: ['openFile'],
          filters: [
            {
              name: 'Executable',
              extensions: ['exe'],
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
