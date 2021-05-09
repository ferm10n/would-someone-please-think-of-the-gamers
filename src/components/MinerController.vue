<template>
  <v-card :loading="gettingMinerStatus">
    <div class="pa-4">
      <v-alert type="warning" text outlined>
        Miner Status is <span class="font-weight-bold">UNKNOWN</span>
        <template #append>
          <v-btn
            icon
            color="warning"
            small
            :disabled="gettingMinerStatus"
            @click="getMinerStatus()"
          >
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
                </pre
            >
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>
  </v-card>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from '@vue/composition-api';
import { useIpcRendererChannel } from '../util';
import type { MinerStatus } from '../../types';

export const MinerController = defineComponent({
  name: 'MinerController',
  setup() {
    const minerStatus = ref<MinerStatus | null>();
    const changingMinerStatus = ref(false);
    const gettingMinerStatus = computed(() => minerStatus === null);
    const busy = computed(
      () => gettingMinerStatus.value || changingMinerStatus.value
    );

    const { send: sendGetMinerStatus } = useIpcRendererChannel(
      'get-miner-status',
      (event, minerStatusReply) => {
        minerStatus.value = minerStatusReply;
      }
    );

    function getMinerStatus() {
      if (gettingMinerStatus.value) {
        return;
      }
      minerStatus.value = null;
      sendGetMinerStatus();
    }

    return {
      gettingMinerStatus,
      minerStatus,
      busy,
      changingMinerStatus,
      getMinerStatus,
    };
  },
});
export default MinerController;
</script>
