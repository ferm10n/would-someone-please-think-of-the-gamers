import merge from 'lodash.merge';
import type { MinerStatus } from 'types';
import type { GetterTree, MutationTree } from 'vuex';
import type { RootState } from './main.store';
import pkg from '../../package.json';
import {
  createPersistedState,
  createSharedMutations,
} from '@ferm10n/vuex-electron/dist';
import { getterTree, mutationTree } from 'typed-vuex';

/** possible paths that can be modified */
export type PathId = 'minerPath' | 'startCmd';

export const mutations = mutationTree({} as RootState, {
  setChannel(state, channel) {
    state.channel = channel;
  },
  setPath(state, payload: { pathId: PathId; path: string }) {
    state[payload.pathId] = payload.path;

    // avoid unneeded starts/stops when the minerPath changes
    if (payload.pathId === 'minerPath') {
      state.desiredMinerStatus = 'unknown';
    }
  },
  setStartCmd(state, cmd: string) {
    state.startCmd = cmd;
  },
  setError(state, error: RootState['error']) {
    state.error = error;
  },
  updateMinerStatus(state, minerStatus: MinerStatus) {
    state.minerStatus = minerStatus;
  },
  addLogLine(state, logLine) {
    state.minerLogs.push(logLine);
    while (state.minerLogs.length > state.maxLogLength) {
      state.minerLogs.shift();
    }
  },
  // TODO use this somewhere
  resetMinerLogs(state) {
    state.minerLogs = [];
  },
  // this should only ever be called in the toggleMiner action
  // we would set the desired miner status in the action too, except that mutations get persisted to disk
  setDesiredMinerStatus(state, status: MinerStatus['status']) {
    state.desiredMinerStatus = status;
  },
  setVersion(state, version: string) {
    state.version = version;
  },
  setShowMinerLogs(state, show: boolean) {
    state.showMinerLogs = show;
  },
  patchState(state, patch: Partial<RootState>) {
    merge(state, patch);
  },
});

export const getters = getterTree({} as RootState, {
  homepage() {
    return pkg.homepage;
  },
  changingMinerStatus(state) {
    return (
      state.desiredMinerStatus !== 'unknown' &&
      state.minerStatus.status !== state.desiredMinerStatus
    );
  },
  canChangeMinerStatus(state, storeGetters): boolean {
    return Boolean(
      state.minerPath &&
        !storeGetters.changingMinerStatus &&
        state.minerStatus.status !== 'unknown'
    );
  },
});

export const plugins = [
  createPersistedState({
    blacklist: [
      'setError',
      'updateMinerStatus',
      'addLogLine',
      'resetMinerLogs',
    ] as (keyof typeof mutations)[],
  }),
  createSharedMutations(),
];
