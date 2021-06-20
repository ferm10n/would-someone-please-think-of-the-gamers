<script lang="ts">
import { defineComponent, computed, watch } from '@vue/composition-api';
import { ResetSettings } from './components/ResetSettings.vue';
import { MinerController } from './components/MinerController.vue';
import { accessor } from './store/renderer.store';
import type { PathId } from './store/shared.store';

export default defineComponent({
  name: 'App',
  components: {
    ResetSettings,
    MinerController,
  },
  setup() {
    // TODO prevent editing minerPath while miner is running

    const version = computed(() => accessor.version);
    const channel = computed(() => accessor.channel);
    const minerPath = computed({
      get: () => accessor.minerPath,
      set: (val) => accessor.patchState({ minerPath: val }),
    });
    const startCmd = computed({
      get: () => accessor.startCmd,
      set: (val) => accessor.setStartCmd(val),
    });

    // when the miner path changes, recheck
    // this is done on the client because the server doesn't really care
    watch(minerPath, () => {
      accessor.checkMinerStatus();
    });

    return {
      refreshStore: async () => {
        console.log(await accessor.refreshStore());
      },
      storeReady: computed(() => minerPath.value !== null),
      minerPath,
      startCmd,
      version,
      channel,
      openGithub: () => accessor.openGithub(),
      pickPath(pathId: PathId) {
        accessor.pickPath({
          pathId,
          opts: {
            title: 'Set the file path to the miner executable',
            properties: ['openFile'],
            filters: [
              {
                name: 'Executable',
                extensions: ['exe', 'bat'],
              },
            ],
          },
        });
      },
      required: (val: string | null) =>
        val && val.length > 0 ? true : 'Required',
    };
  },
});
</script>

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
