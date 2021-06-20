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

export const plugins = [createSharedMutations()];
