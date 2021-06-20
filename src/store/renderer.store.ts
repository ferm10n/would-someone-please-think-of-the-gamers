import type { RootState, StorePattern } from './main.store';
import Vue from 'vue';
import Vuex from 'vuex';
import { useAccessor } from 'typed-vuex';
import { ipcRenderer } from 'electron';
import { getters, mutations, plugins } from './shared.store';

const actions: {
  [action in keyof StorePattern['actions']]: () => void;
} = {
  checkMinerStatus: () => {},
  openGithub: () => {},
  pickPath: () => {},
  refreshStore: () => {},
  requestSetPath: () => {},
  requestSetShowMinerLogs: () => {},
  requestSetStartCmd: () => {},
  resetCfg: () => {},
  toggleMiner: () => {},
};

const storePattern: StorePattern = {
  state: () => ipcRenderer.sendSync('vuex-get-store-state') as RootState,
  getters,
  mutations: mutations,
  plugins: plugins,
  actions: (actions as unknown) as StorePattern['actions'],
};

Vue.use(Vuex);
export const store = new Vuex.Store(storePattern);
export const accessor = useAccessor(store, storePattern);
