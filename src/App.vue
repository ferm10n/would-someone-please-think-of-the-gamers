<template>
  <v-app>
    <v-main class="pa-8">
      <p class="display-1">Configuration</p>
      <v-text-field
        v-model="minerPath"
        label="Path to miner executable"
        filled
        prepend-icon="mdi-pickaxe"
        append-icon="mdi-folder-open"
        :rules="[required]"
        @click:append="pickMinerPath"
      />
      <v-text-field
        label="Miner CLI args (optional)"
        v-model="minerArgs"
        filled
        prepend-icon="mdi-console-line"
      />
      <button @click="testProbe()">Test Probe</button>
    </v-main>
  </v-app>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';
import { useIpcEventHandler } from './util';
import type { OpenDialogReturnValue, OpenDialogOptions } from 'electron';

export default defineComponent({
  name: 'App',
  setup() {
    useIpcEventHandler<string[]>('test-probe-reply', (event, args) => {
      alert(JSON.stringify(args));
    });

    const minerPath = ref<string>('');
    const minerArgs = ref<string>('');
    useIpcEventHandler<[string, OpenDialogReturnValue]>(
      'pick-path-reply',
      (event, [type, val]) => {
        switch (type) {
          case 'miner':
            minerPath.value = val.filePaths[0] || '';
            break;
          default:
            return;
        }
      }
    );

    return {
      testProbe() {
        window.ipcRenderer.send('test-probe');
      },
      minerPath,
      minerArgs,
      pickMinerPath() {
        window.ipcRenderer.send('pick-path', [
          'miner',
          {
            title: 'Set the file path to the miner executable',
            properties: ['openFile'],
            filters: [
              {
                name: 'Executable',
                extensions: ['exe'],
              },
            ],
          } as OpenDialogOptions,
        ]);
      },
      required: (val: string) => val.length > 0,
    };
  },
});
</script>
