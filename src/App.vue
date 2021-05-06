<template>
  <v-app>
    <v-main class="pa-8" v-if="store">
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
      <v-card class="pa-4">
        <v-alert type="warning" text outlined>
          Miner Status is <span class="font-weight-bold">UNKNOWN</span>
          <template #append>
            <v-btn icon color="warning" small>
              <v-icon>mdi-refresh</v-icon>
            </v-btn>
          </template>
        </v-alert>
        <v-switch inset color="green">
          <template #label>
            Click to start miner
            <v-progress-circular
              indeterminate
              :value="0"
              size="24"
              class="ml-2"
            />
          </template>
        </v-switch>
        <v-expansion-panels accordion>
          <v-expansion-panel>
            <v-expansion-panel-header>Miner logs</v-expansion-panel-header>
            <v-expansion-panel-content>
              <pre>
GPUs power: 260.7 W
Eth: New job from eu1.ethermine.org:4444; diff: 4295MH
Eth speed: 93.678 MH/s, shares: 1561/0/0, time: 18:48
Eth: New job from eu1.ethermine.org:4444; diff: 4295MH
Eth speed: 90.237 MH/s, shares: 1561/0/0, time: 18:48
Eth: New job from eu1.ethermine.org:4444; diff: 4295MH
Eth: New job from eu1.ethermine.org:4444; diff: 4295MH
Eth speed: 89.565 MH/s, shares: 1561/0/0, time: 18:48
Eth: New job from eu1.ethermine.org:4444; diff: 4295MH
Eth: New job from eu1.ethermine.org:4444; diff: 4295MH
Eth: New job from eu1.ethermine.org:4444; diff: 4295MH
Eth speed: 90.592 MH/s, shares: 1561/0/0, time: 18:48
Eth: New job from eu1.ethermine.org:4444; diff: 4295MH
Eth: GPU1: ETH share found!
Eth: Share actual difficulty: 4702 MH
Eth: Share accepted in 44 ms
Eth speed: 95.313 MH/s, shares: 1562/0/0, time: 18:48
 
*** 18:48 *** 5/4 21:09 **************************************
Eth: Mining ETH on eu1.ethermine.org:4444 for 18:48
Eth: Accepted shares 1 (1 stales), rejected shares 0 (0 stales)
Eth: Incorrect shares 0 (0.00%), est. stales percentage 0.06%
Eth: Maximum difficulty of found share: 5426.5 GH (!)
Eth: Average speed (5 min): 97.049 MH/s
Eth: Effective speed: 99.09 MH/s; at pool: 99.09 MH/s

Eth: New job #d4cacbcd from eu1.ethermine.org:4444; diff: 4295MH
Eth speed: 99.209 MH/s, shares: 1562/0/0, time: 18:48
GPU1: 57C 97% 272W
GPUs power: 272.0 W
              </pre>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card>
      <v-divider class="my-4" />
      <ResetSettings />
    </v-main>
  </v-app>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import { useIpcEventHandler, useStore, ipcSend } from './util';
import type { OpenDialogReturnValue, OpenDialogOptions } from 'electron';
import { ResetSettings } from './components/ResetSettings.vue';

export default defineComponent({
  name: 'App',
  components: {
    ResetSettings,
  },
  setup() {
    useIpcEventHandler<string[]>('test-probe-reply', (event, args) => {
      alert(JSON.stringify(args));
    });

    const { store, storeAccessor, refreshStore } = useStore();
    const minerPath = storeAccessor('minerPath');
    const minerArgs = storeAccessor('minerArgs');

    useIpcEventHandler<[string, OpenDialogReturnValue]>(
      'pick-path-reply',
      (event, [type, val]) => {
        switch (type) {
          case 'minerPath':
            minerPath.value = val.filePaths[0] || '';
            break;
          default:
            return;
        }
      }
    );

    return {
      refreshStore,
      store,
      testProbe() {
        ipcSend('test-probe');
      },
      minerPath,
      minerArgs,
      pickMinerPath() {
        ipcSend('pick-path', [
          'minerPath',
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
      required: (val: string | null) =>
        val && val.length > 0 ? true : 'Required',
    };
  },
});
</script>
