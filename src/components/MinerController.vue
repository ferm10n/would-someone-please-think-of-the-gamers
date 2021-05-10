<script lang="ts">
import { computed, defineComponent, ref } from '@vue/composition-api';
import { useIpcRendererChannel, useRemoteStoreProp } from '../util';
import type { MinerStatus } from '../../types';

export const MinerController = defineComponent({
  name: 'MinerController',
  setup() {
    const minerStatus = ref<MinerStatus | null>(null);
    const changingMinerStatus = ref(false);
    const gettingMinerStatus = ref(false);

    const minerPath = useRemoteStoreProp('minerPath');
    /** we can get the miner status if the miner path is set, and we're not already getting it */
    const canGetMinerStatus = computed(
      () => minerPath.value && !gettingMinerStatus.value
    );

    /**
     * we can change the miner status if:
     * - miner path is set
     * - we're not already changing the miner status
     * - we're currently getting the miner status (and toggle behavior would be undefined)
     * - we know the miner status (from the main), even if its "unknown"
     */
    const canChangeMinerStatus = computed(
      () =>
        minerPath.value &&
        !changingMinerStatus.value &&
        !gettingMinerStatus.value &&
        minerStatus.value &&
        minerStatus.value.status !== 'unknown'
    );

    const busy = computed(() => gettingMinerStatus.value);

    const { send: sendGetMinerStatus } = useIpcRendererChannel(
      'get-miner-status',
      (event, minerStatusReply) => {
        minerStatus.value = minerStatusReply;
        gettingMinerStatus.value = false;
      }
    );

    function getMinerStatus() {
      // single-file requests
      if (gettingMinerStatus.value || !canGetMinerStatus.value) {
        return;
      }
      gettingMinerStatus.value = true;

      minerStatus.value = null; // resets to unknown

      sendGetMinerStatus();
    }

    // get the status immediately if we can
    if (canGetMinerStatus.value) {
      getMinerStatus();
    }

    const statusAttrs = computed<{
      type: string;
      text: string;
      switchState: boolean;
    }>(() => {
      const minerStatusVal = minerStatus.value;
      if (minerStatusVal) {
        return {
          running: {
            type: 'success',
            text: 'RUNNING',
            switchState: true,
          },
          stopped: {
            type: 'error',
            text: 'STOPPED',
            switchState: false,
          },
          unknown: {
            type: 'warning',
            text: 'UNKNOWN',
            switchState: false,
          },
        }[minerStatusVal.status];
      } else {
        return {
          type: 'warning',
          text: 'UNKNOWN',
          switchState: false,
        };
      }
    });

    const { send: sendToggleMiner } = useIpcRendererChannel(
      'toggle-miner',
      () => {
        changingMinerStatus.value = false;
        getMinerStatus();

        // TODO on start, clear log panel
      }
    );
    function toggleMiner() {
      if (canChangeMinerStatus.value && minerStatus.value) {
        /** true if not running */
        const desired = minerStatus.value.status !== 'running';
        changingMinerStatus.value = true;
        sendToggleMiner(desired);
      }
    }

    // TODO canToggleMiner

    return {
      gettingMinerStatus,
      minerStatus,
      statusAttrs,
      busy,
      changingMinerStatus,
      getMinerStatus,
      canGetMinerStatus,
      toggleMiner,
    };
  },
});
export default MinerController;
</script>

<template>
  <v-card :loading="gettingMinerStatus">
    <div class="pa-4">
      <v-alert :type="statusAttrs.type" text outlined>
        Miner Status is
        <span class="font-weight-bold">{{ statusAttrs.text }}</span>
        <template #append>
          <v-btn
            icon
            :color="statusAttrs.type"
            small
            :disabled="!canGetMinerStatus"
            @click="getMinerStatus()"
          >
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
        </template>
      </v-alert>
      <v-switch
        inset
        color="green"
        :value="statusAttrs.switchState"
        @click="toggleMiner"
        readonly
      >
        <template #label>
          Click to {{ statusAttrs.switchState ? 'stop' : 'start' }} miner
          <v-progress-circular
            v-if="changingMinerStatus"
            indeterminate
            :value="0"
            size="24"
            class="ml-2"
          />
        </template>
      </v-switch>
      <v-expand-transition appear>
        <v-expansion-panels
          v-if="
            minerStatus &&
            minerStatus.status === 'running' &&
            minerStatus.external === false
          "
          accordion
        >
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
              </pre>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-expand-transition>
    </div>
  </v-card>
</template>
