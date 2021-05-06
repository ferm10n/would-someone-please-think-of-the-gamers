import ElectronStore from 'electron-store';
import { ipcMain, dialog, OpenDialogOptions } from 'electron';
import { Store } from '../../types/store';

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
ipcMain.on('pick-path', (event, [id, opts]: [string, OpenDialogOptions]) => {
  console.log('pick-path');
  dialog.showOpenDialog(opts).then((val) => {
    event.sender.send('pick-path-reply', [id, val]);
  });
});

// gets the entire store
ipcMain.on('get-store', (event) => {
  console.log('get-store');
  event.sender.send('get-store-reply', store.store);
});

// sets a key on the store
ipcMain.on('store-set', (event, storePart: Partial<Store>) => {
  console.log('store-set', storePart);
  store.set(storePart);
});

ipcMain.on('store-reset', (event) => {
  console.log('store-reset');
  store.clear();
  event.sender.send('get-store-reply', store.store);
});
