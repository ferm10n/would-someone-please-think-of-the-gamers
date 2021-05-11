import { useIpcMainChannel, sendError, windowAccessor } from './util';
import { store } from './store';
import { execSync, exec, ChildProcess } from 'child_process';
import parseCsv from 'csv-parse/lib/sync';
import { MinerStatus } from '../../types';
import readline from 'readline';

// TODO maybe check if multiple instances are detected, to prevent someone killing a proc they shouldn't. would only need to handle this in the kill handler

let minerChild: ChildProcess | null = null;

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
        external: minerChild === null,
        status: 'running',
        pids: result.map((r) => r.ProcessId),
      };
    } else {
      return {
        external: false,
        status: 'stopped',
        pids: [],
      };
    }
  } catch (err) {
    sendError({ message: 'Failed to get miner status', ...err });
    return {
      external: false,
      status: 'unknown',
      pids: [],
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
      pids: [],
    });
  }
});

// TODO on every check, should set the minerChild to null if it's external

const { send: sendMinerLog } = useIpcMainChannel('miner-log');

useIpcMainChannel('toggle-miner', (event, reply, desired) => {
  const minerPath = store.get('minerPath');

  // abort if miner cannot be controlled yet
  if (!minerPath) {
    return;
  }

  const minerStatus = getMinerStatus(minerPath);

  if (desired && minerStatus.status === 'stopped') {
    // start the miner
    minerChild = exec(store.get('startCmd') || `"${minerPath}"`);
    const win = windowAccessor.get();
    if (minerChild.stdout) {
      minerChild.stdout.pipe(process.stdout);
      if (win) {
        readline
          .createInterface(minerChild.stdout)
          .on('line', (l) => sendMinerLog(win.webContents, l));
      }
    }
    if (minerChild.stderr) {
      minerChild.stderr.pipe(process.stderr);
      if (win) {
        readline
          .createInterface(minerChild.stderr)
          .on('line', (l) => sendMinerLog(win.webContents, l));
      }
    }
    reply(true);
  } else if (!desired && minerStatus.status === 'running') {
    // kill the miner
    for (const pid of minerStatus.pids) {
      process.kill(Number(pid), 'SIGINT');
      reply(true);
    }
  } else {
    // the renderer must be out of sync
    sendMinerStatus(event.sender, minerStatus);
    reply(false);
  }
});
