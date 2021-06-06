'use strict';

import { app, protocol, BrowserWindow } from 'electron';
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib';
import path from 'path';
import './init-vue';
import { accessor } from '../store';
import './miner';
import { autoUpdater } from 'electron-updater';
import ElectronStore from 'electron-store';
const isDevelopment = process.env.NODE_ENV !== 'production';
ElectronStore.initRenderer();

// using prerelease from github seems to work
// 0.0.1 --> 0.0.2
// 0.0.2 -/-> 0.0.3-alpha
// 0.0.3-alpha --> 0.0.3-alpha.2
// 0.0.3-alpha.2 -/-> 0.0.3-alpha

console.log(`version: ${JSON.stringify(autoUpdater.currentVersion)}`);
autoUpdater.channel = accessor.channel;
console.log(`channel: ${autoUpdater.channel}`);
accessor.setVersion(autoUpdater.currentVersion.version);
if (accessor.channel === '') {
  console.log('channel is not set, defaulting it...');
  accessor.setChannel(
    String(autoUpdater.currentVersion.prerelease[0] || 'latest')
  );
}

// TODO add uncaught handler

// conditionally install devtools
if (isDevelopment && !process.env.IS_TEST) {
  const {
    default: installExtension,
    VUEJS_DEVTOOLS,
    // eslint-disable-next-line @typescript-eslint/no-var-requires
  } = require('electron-devtools-installer');
  app.on('ready', async () => {
    try {
      await installExtension(VUEJS_DEVTOOLS);
      console.log('Added vuejs devtools extension');
    } catch (err) {
      console.error('Failed to add vuejs devtools extension', err);
    }
  });
}

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } },
]);

async function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 800,
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: (process.env
        .ELECTRON_NODE_INTEGRATION as unknown) as boolean,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
    },
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string);
    if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    createProtocol('app');
    // Load the index.html when not in development
    win.loadURL('app://./index.html');
    autoUpdater.checkForUpdatesAndNotify();
  }
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  console.log('all closed');
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  createWindow();
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit();
      }
    });
  } else {
    process.on('SIGTERM', () => {
      app.quit();
    });
  }
}
