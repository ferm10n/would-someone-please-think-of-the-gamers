import ElectronStore from 'electron-store';
import { dialog } from 'electron';
import { Store } from '../../types';
import { useIpcMainChannel } from './util';

export const store = new ElectronStore<Store>({
  schema: {
    minerPath: {
      type: 'string',
      default: '',
    },
    minerArgs: {
      type: 'array',
      items: {
        type: 'string',
        minLength: 1,
      },
      default: [],
    },
  },
});

// when the ui requests, show a path picker
useIpcMainChannel('pick-path', (event, reply, pathId, opts) => {
  dialog.showOpenDialog(opts).then((val) => {
    reply(pathId, val);
  });
});

// gets the entire store
const { send: sendGetStoreReply } = useIpcMainChannel(
  'get-store',
  (event, reply) => reply(store.store)
);

// sets a key on the store
useIpcMainChannel('store-set', (event, reply, patchStore) => {
  store.set(patchStore);
  reply(patchStore);
  sendGetStoreReply(event.sender, store.store);
});

useIpcMainChannel('store-reset', (event) => {
  store.clear();
  sendGetStoreReply(event.sender, store.store);
});
