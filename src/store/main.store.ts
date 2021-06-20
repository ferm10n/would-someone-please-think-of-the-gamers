import { ipcMain, dialog, shell } from 'electron';
import { actionTree, useAccessor } from 'typed-vuex';
import type { MinerStatus } from 'types';
import Vue from 'vue';
import Vuex from 'vuex';
import { mutations, getters, PathId, plugins } from './shared.store';
import { OpenDialogOptions } from 'electron/main';

export type RootState = {
  version: string;
  channel: string;
  minerPath: string;
  startCmd: string;
  error: { message: string; [extra: string]: unknown } | null;
  minerStatus: MinerStatus;
  minerLogs: string[];
  maxLogLength: number;
  showMinerLogs: boolean;
  desiredMinerStatus: MinerStatus['status'];
};

export const state = (): RootState => ({
  version: '',
  channel: '',
  minerPath: '',
  startCmd: '',
  // TODO handle when this is received on the client
  error: null,
  minerStatus: {
    external: false,
    status: 'unknown',
    pids: [],
  },
  minerLogs: [],
  maxLogLength: 15,
  showMinerLogs: true,
  desiredMinerStatus: 'unknown',
});

export const actions = actionTree(
  {
    state,
    getters,
    mutations,
  },
  {
    /** when requested by the UI, show a path picker dialog */
    async pickPath(ctx, payload: { pathId: PathId; opts: OpenDialogOptions }) {
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
      const { getMinerStatus } = await import('../background/miner');
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
  plugins,
};

export type StorePattern = typeof storePattern;

Vue.use(Vuex);
export const store = new Vuex.Store(storePattern);
export const accessor = useAccessor(store, storePattern);

ipcMain.on('vuex-get-store-state', (event) => {
  const myState = state();
  console.log('remote state requested', myState);
  event.returnValue = myState;
});
