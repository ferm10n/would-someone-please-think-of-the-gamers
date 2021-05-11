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

    const minerLogs = ref<string[]>([]);
    const maxLines = 15;
    useIpcRendererChannel('miner-log', (event, logLine) => {
      minerLogs.value.push(logLine);
      while (minerLogs.value.length > maxLines) {
        minerLogs.value.shift();
      }
    });

    const { send: sendToggleMiner } = useIpcRendererChannel(
      'toggle-miner',
      () => {
        changingMinerStatus.value = false;
        getMinerStatus();

        minerLogs.value = [];
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

    return {
      gettingMinerStatus,
      minerStatus,
      statusAttrs,
      busy,
      changingMinerStatus,
      getMinerStatus,
      canGetMinerStatus,
      toggleMiner,
      minerLogs,
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
        <v-expansion-panels v-show="minerLogs.length > 0" accordion>
          <v-expansion-panel>
            <v-expansion-panel-header>Miner logs</v-expansion-panel-header>
            <v-expansion-panel-content>
              <pre class="pa-2 rounded" style="background-color: #091017">{{
                minerLogs.join('\n')
              }}</pre>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-expand-transition>
    </div>
  </v-card>
</template>
