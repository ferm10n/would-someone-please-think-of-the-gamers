import type { RootState, StorePattern } from './main.store';
import Vue from 'vue';
import Vuex from 'vuex';
import { useAccessor } from 'typed-vuex';
import { ipcRenderer } from 'electron';
import { getters, mutations, plugins } from './shared.store';

// implementations for actions need access to main proc stuff,
// which I don't want to use in the renderer.
// However, in order for typed-vuex to work, the actions object
// needs keys to real functions.
// This is my workaround for this right now.
const actions: {
  [action in keyof StorePattern['actions']]: () => void;
} = {
  checkMinerStatus: () => {},
  openGithub: () => {},
  pickPath: () => {},
  refreshStore: () => {},
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
