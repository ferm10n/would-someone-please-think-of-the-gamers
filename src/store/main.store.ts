import { ipcMain, dialog, shell } from 'electron';
import { actionTree, useAccessor } from 'typed-vuex';
import type { MinerStatus } from 'types';
import Vue from 'vue';
import Vuex from 'vuex';
import { mutations, getters, PathId, plugins } from './shared.store';
import { OpenDialogOptions } from 'electron/main';
import { createPersistedState } from '@ferm10n/vuex-electron/dist';
import { autoUpdater } from 'electron-updater';
import ElectronStore from 'electron-store';

const STORAGE_NAME = 'vuex';
const STORAGE_KEY = 'state';
const storage = new ElectronStore({ name: STORAGE_NAME });

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
  version: autoUpdater.currentVersion.version,
  /** this value will be replaced by whatever is in the store */
  channel: String(autoUpdater.currentVersion.prerelease[0] || 'latest'),
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
    async pickPath(
      { commit },
      payload: { pathId: PathId; opts: OpenDialogOptions }
    ) {
      const pickResult = await dialog.showOpenDialog(payload.opts);

      accessor.patchState({ [payload.pathId]: pickResult.filePaths[0] || '' });
    },
    async resetCfg({ state: currentState, commit }) {
      // TODO prevent if miner is running internally
      storage.delete(STORAGE_KEY);
      commit('patchState', state());
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
      accessor.patchState({ minerStatus: getMinerStatus() });
    },
    async toggleMiner(ctx, desiredStatus?: MinerStatus['status']) {
      // changing miner status does not work unless the current miner status is known
      await accessor.checkMinerStatus();

      if (!desiredStatus) {
        desiredStatus =
          accessor.minerStatus.status !== 'running' ? 'running' : 'stopped';
      }

      if (accessor.canChangeMinerStatus) {
        accessor.patchState({ desiredMinerStatus: desiredStatus });
        await accessor.checkMinerStatus();
      }
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
      whitelist: [
        'channel',
        'minerPath',
        'startCmd',
        'maxLogLength',
        'showMinerLogs',
        'desiredMinerStatus',
      ],
      storage,
      storageKey: STORAGE_KEY,
      storageName: STORAGE_NAME,
    }),
    ...plugins,
  ],
};

export type StorePattern = typeof storePattern;

Vue.use(Vuex);
export const store = new Vuex.Store(storePattern);
export const accessor = useAccessor(store, storePattern);

ipcMain.on('vuex-get-store-state', (event) => {
  event.returnValue = store.state;
});
