<script lang="ts">
import { accessor } from '@/store';
import { computed, defineComponent } from '@vue/composition-api';

export const MinerController = defineComponent({
  name: 'MinerController',
  setup() {
    const changingMinerStatus = computed(() => accessor.changingMinerStatus);
    const minerPath = computed(() => accessor.minerPath);
    const minerStatus = computed(() => accessor.minerStatus);

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
        minerStatus.value &&
        minerStatus.value.status !== 'unknown'
    );

    function getMinerStatus() {
      accessor.checkMinerStatus();
    }

    // get the status immediately
    getMinerStatus();

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

    const minerLogs = computed(() => accessor.minerLogs);
    const showMinerLogs = computed({
      get: () => (accessor.showMinerLogs === true ? 0 : null),
      set: (val) => accessor.requestSetShowMinerLogs(val === 0 ? true : false),
    });

    return {
      minerStatus,
      statusAttrs,
      changingMinerStatus,
      getMinerStatus,
      /** if we can change it, we get change it */
      canGetMinerStatus: computed(() => canChangeMinerStatus),
      toggleMiner: () => accessor.toggleMiner(),
      minerLogs,
      showMinerLogs,
    };
  },
});
export default MinerController;
</script>

<template>
  <v-card>
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
          v-show="minerLogs.length > 0"
          accordion
          v-model="showMinerLogs"
        >
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
