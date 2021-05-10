import { useIpcMainChannel, sendError, windowAccessor } from './util';
import { store } from './store';
import { execSync } from 'child_process';
import parseCsv from 'csv-parse/lib/sync';
import { MinerStatus } from '../../types';

// TODO maybe check if multiple instances are detected, to prevent someone killing a proc they shouldn't. would only need to handle this in the kill handler

const minerPid: string | null = null;

// the miner status should not be sent if there is no minerPath. this should preserve the "unknown" state in the renderer.

function getMinerStatus(minerPath: string): MinerStatus {
  try {
    // TODO check for valid miner path?

    // look for running miner
    const resultStr = execSync(
      `wmic process where 'ExecutablePath = "${minerPath.replace(
        /\\/gimu,
        '\\\\'
      )}"' get ProcessID /format:csv`,
      { stdio: 'pipe' }
    )
      .toString()
      .trim();

    // parse output
    const result: { Node: string; ProcessId: string }[] = parseCsv(resultStr, {
      skipEmptyLines: true,
      trim: true,
      columns: true,
    });

    // send result
    if (result.length > 0) {
      return {
        external: minerPid === null,
        status: 'running',
      };
    } else {
      return {
        external: false,
        status: 'stopped',
      };
    }
  } catch (err) {
    sendError({ message: 'Failed to get miner status', ...err });
    return {
      external: false,
      status: 'unknown',
    };
  }
}

const { send: sendMinerStatus } = useIpcMainChannel(
  'get-miner-status',
  (event, reply) => {
    const minerPath = store.get('minerPath');
    if (minerPath.length > 0) {
      reply(getMinerStatus(minerPath));
    }
  }
);

// when the miner path changes, recheck
store.onDidChange('minerPath', () => {
  const minerPath = store.get('minerPath');
  const win = windowAccessor.get();
  if (minerPath.length > 0 && win) {
    sendMinerStatus(win.webContents, getMinerStatus(minerPath));
  } else if (win) {
    sendMinerStatus(win.webContents, {
      status: 'unknown',
      external: false,
    });
  }
});
