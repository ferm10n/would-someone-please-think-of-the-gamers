import {
  computed,
  onUnmounted,
  ref,
  getCurrentInstance,
  WritableComputedRef,
} from '@vue/composition-api';
import { IpcRendererEvent } from 'electron';
import { Store, MessageMap, ClientMessageMap } from '../types';

/**
 * allows a component to send and receive on an ipc channel.
 * also performs cleanup.
 */
export function useIpcRendererChannel<CHAN extends keyof ClientMessageMap>(
  channel: CHAN,
  onReply?: (
    event: IpcRendererEvent,
    ...args: MessageMap[CHAN]['serverArgs']
  ) => void
): { send: (...args: MessageMap[CHAN]['clientArgs']) => void } {
  if (onReply) {
    /** wrapped handler that logs things */
    const wrapCb = (
      event: IpcRendererEvent,
      ...args: MessageMap[CHAN]['serverArgs']
    ) => {
      console.log('⬇', channel, ...args);
      onReply(event, ...args);
    };

    // add the binding
    window.ipcRenderer.on(
      channel,
      // not sure how to relax tsc with the any[] to tuple type from MessageMap
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      wrapCb as (event: IpcRendererEvent, ...args: any[]) => void
    );

    // if used in a component, do cleanup
    if (getCurrentInstance()) {
      onUnmounted(() =>
        window.ipcRenderer.off(
          channel,
          // not sure how to relax tsc with the any[] to tuple type from MessageMap
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          wrapCb as (event: IpcRendererEvent, ...args: any[]) => void
        )
      );
    }
  }

  // provide a way to send on the channel
  return {
    send: (...args) => {
      console.log('⬆', channel, ...args);
      window.ipcRenderer.send(channel, ...args);
    },
  };
}

const store = ref<Store | null>(null);

const { send: storeSet } = useIpcRendererChannel(
  'store-set',
  (event, patchedStore) => {
    if (store.value) {
      Object.assign(store.value, patchedStore);
    }
  }
);

/** allows getting and setting a prop in the remote store */
export function useRemoteStoreProp<T extends keyof Store>(
  key: T
): WritableComputedRef<Store[T] | null> {
  return computed({
    get: () => {
      return (store.value && store.value[key]) || null;
    },
    set: (val) => {
      storeSet({ [key]: val });
      // TODO after set in bg, should send get-store
    },
  });
}

export const { send: refreshStore } = useIpcRendererChannel(
  'get-store',
  (event, mainStore) => {
    store.value = mainStore;
  }
);
