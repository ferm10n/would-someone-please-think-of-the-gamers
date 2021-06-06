import { dialog, shell } from 'electron';
import type { IpcMain, IpcRenderer, OpenDialogOptions } from 'electron';
import { MinerStatus } from '../types';
import Vue from 'vue';
import Vuex from 'vuex';
import {
  createPersistedState,
  createSharedMutations,
} from '@ferm10n/vuex-electron';
import { actionTree, getterTree, mutationTree, useAccessor } from 'typed-vuex';
import pkg from '../package.json';
import { getMinerStatus } from './background/miner';

Vue.use(Vuex);

/** possible paths that can be modified */
export type PathId = 'minerPath' | 'startCmd';

const state = () => ({
  version: '',
  channel: '',
  minerPath: '',
  startCmd: '',
  // TODO handle when this is received on the client
  error: null as { message: string; [extra: string]: unknown } | null,
  minerStatus: {
    external: false,
    status: 'unknown',
    pids: [],
  } as MinerStatus,
  minerLogs: [] as string[],
  maxLogLength: 15,
  showMinerLogs: true,
  desiredMinerStatus: 'unknown' as MinerStatus['status'],
});

type RootState = ReturnType<typeof state>;

const mutations = mutationTree(state, {
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
});

const getters = getterTree(state, {
  homepage() {
    return pkg.homepage;
  },
  changingMinerStatus(state) {
    return (
      state.desiredMinerStatus !== 'unknown' &&
      state.minerStatus.status !== state.desiredMinerStatus
    );
  },
  canChangeMinerStatus(): boolean {
    return Boolean(
      accessor.minerPath &&
        !accessor.changingMinerStatus &&
        accessor.minerStatus.status !== 'unknown'
    );
  },
});

const actions = actionTree(
  {
    state,
    mutations,
    getters,
  },
  {
    /** when requested by the UI, show a path picker dialog */
    async pickPath(ctx, payload: { pathId: PathId; opts: OpenDialogOptions }) {
      const { dialog } = await import('electron');
      const pickResult = await dialog.showOpenDialog(payload.opts);
      accessor.setPath({
        pathId: payload.pathId,
        path: pickResult.filePaths[0] || '',
      });
    },
    async resetCfg({ state }) {
      // TODO prevent if miner is running internally
      state.minerPath = '';
      state.startCmd = '';
    },
    openGithub() {
      shell.openExternal(accessor.homepage);
    },
    // might not be needed
    async refreshStore({ state }) {
      const serializedState = JSON.parse(JSON.stringify(state));
      console.log(serializedState);
      return serializedState;
    },
    async checkMinerStatus() {
      const { getMinerStatus } = await import('./background/miner');
      accessor.updateMinerStatus(getMinerStatus());
    },
    async toggleMiner(ctx, desiredStatus?: MinerStatus['status']) {
      // changing miner status does not work unless the current miner status is known
      await accessor.checkMinerStatus();

      if (!desiredStatus) {
        desiredStatus =
          accessor.minerStatus.status !== 'running' ? 'running' : 'stopped';
      }

      if (accessor.canChangeMinerStatus) {
        accessor.setDesiredMinerStatus(desiredStatus);
        await accessor.checkMinerStatus();
      }
    },
    requestSetPath(ctx, payload: { pathId: PathId; path: string }) {
      ctx.commit('setPath', payload);
    },
    requestSetStartCmd(ctx, cmd: string) {
      ctx.commit('setStartCmd', cmd);
    },
    requestSetShowMinerLogs(ctx, show: boolean) {
      ctx.commit('setShowMinerLogs', show);
    },
  }
);

const storePattern = {
  state,
  mutations,
  getters,
  actions,
  plugins: [
    createPersistedState({
      blacklist: [
        'setError',
        'updateMinerStatus',
        'addLogLine',
        'resetMinerLogs',
      ] as (keyof typeof mutations)[],
    }),
    createSharedMutations(),
  ],
};
export const store = new Vuex.Store(storePattern);
export const accessor = useAccessor(store, storePattern);
