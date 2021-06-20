import './init-vue';
import { accessor } from '../store/main.store';
import { execSync, exec, ChildProcess } from 'child_process';
import parseCsv from 'csv-parse/lib/sync';
import { MinerStatus } from '../../types';
import readline from 'readline';
import { watch } from '@vue/composition-api';

// TODO if miner is started externally, check its status on an interval. otherwise we should be able to rely on event handlers on the child process

// TODO maybe check if multiple instances are detected, to prevent someone killing a proc they shouldn't. would only need to handle this in the kill handler

let minerChild: ChildProcess | null = null;

// the miner status should not be sent if there is no minerPath. this should preserve the "unknown" state in the renderer.

export function getMinerStatus(): MinerStatus {
  // method 1: check if `minerChild` is alive
  // if (minerChild) {
  //   minerChild.
  // }

  // method 2: check if miner is started externally
  try {
    // TODO check for valid miner path?
    const minerPath = accessor.minerPath;

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
    accessor.setError({ message: 'Failed to get miner status', ...err });
    return {
      external: false,
      status: 'unknown',
      pids: [],
    };
  }
}

// TODO on every check, should set the minerChild to null if it's external

watch(
  // this should only ever be changed by the action, which will ensure the miner status is up to date
  () => accessor.desiredMinerStatus,
  (desiredMinerStatus) => {
    const minerPath = accessor.minerPath;
    const minerStatus = accessor.minerStatus.status;

    // abort if miner cannot be controlled yet
    if (
      accessor.canChangeMinerStatus ||
      minerStatus === 'unknown' ||
      desiredMinerStatus === minerStatus ||
      desiredMinerStatus === 'unknown'
    ) {
      return;
    }

    if (desiredMinerStatus === 'running' && minerStatus === 'stopped') {
      // start the miner
      const startCmd = accessor.startCmd || minerPath; // TODO do I need to wrap quotes around the minerPath?
      minerChild = exec(startCmd);
      minerChild.on('error', () => {
        accessor.setDesiredMinerStatus('stopped');
      });
      minerChild.on('exit', () => {
        accessor.setDesiredMinerStatus('stopped');
      });
      if (minerChild.stdout) {
        minerChild.stdout.pipe(process.stdout);
        readline
          .createInterface(minerChild.stdout)
          .on('line', (l) => accessor.addLogLine(l));
      }
      if (minerChild.stderr) {
        minerChild.stderr.pipe(process.stderr);
        readline
          .createInterface(minerChild.stderr)
          .on('line', (l) => accessor.addLogLine(l));
      }
    } else if (desiredMinerStatus === 'stopped' && minerStatus === 'running') {
      // kill the miner
      for (const pid of accessor.minerStatus.pids) {
        process.kill(Number(pid), 'SIGINT');
      }
    }
  },
  { immediate: true }
);
