import { computed, onUnmounted, ref } from '@vue/composition-api';
import { IpcRenderer, IpcRendererEvent } from 'electron';
import { Store } from 'types/store';
import Vue from 'vue';

export const ipcSend: IpcRenderer['send'] = (
  ...args: Parameters<IpcRenderer['send']>
) => {
  console.log(...args);
  window.ipcRenderer.send(...args);
};

export function useIpcEventHandler<T>(
  eventName: string,
  cb: (event: IpcRendererEvent, args: T) => void
): void {
  if ('ipcRenderer' in window) {
    const wrapCb = (event: IpcRendererEvent, args: T) => {
      console.log(eventName, args);
      cb(event, args);
    };
    window.ipcRenderer.on(eventName, wrapCb);
    onUnmounted(() => window.ipcRenderer.off(eventName, wrapCb));
  }
}

const store = ref<Store | null>(null);
function storeAccessor<T extends keyof Store>(key: T) {
  return computed({
    get: () => {
      return (store.value && store.value[key]) || null;
    },
    set: (val) => {
      ipcSend('store-set', { [key]: val });
      const storeVal = store.value;
      if (storeVal) {
        Vue.set(storeVal, key, val);
      }
    },
  });
}

function refreshStore() {
  ipcSend('get-store');
}

/** switched on the first call to `useStore */
let storeSyncing = false;

export function useStore(): {
  store: typeof store;
  storeAccessor: typeof storeAccessor;
  refreshStore: typeof refreshStore;
} {
  if (!storeSyncing) {
    useIpcEventHandler<Store>('get-store-reply', (event, mainStore) => {
      store.value = mainStore;
    });
    refreshStore();
    storeSyncing = true;
  }

  return {
    store,
    storeAccessor,
    refreshStore,
  };
}
