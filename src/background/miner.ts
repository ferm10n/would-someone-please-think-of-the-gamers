import { useIpcMainChannel, sendError } from './util';
import { store } from './store';
import { execSync } from 'child_process';
import parseCsv from 'csv-parse/lib/sync';

// TODO recheck miner status whenever the miner path changes
// TODO maybe check if multiple instances are detected, to prevent someone killing a proc they shouldn't

const minerPid: string | null = null;

const { send: sendMinerStatus } = useIpcMainChannel(
  'get-miner-status',
  (event, reply) => {
    const minerPath = store.get('minerPath');
    if (minerPath.length > 0) {
      minerPath.replace(/\\/u, '\\');
      try {
        const resultStr = execSync(
          `wmic process where 'ExecutablePath = "${minerPath.replace(
            /\\/gimu,
            '\\\\'
          )}"' get ProcessID /format:csv`,
          {
            stdio: 'pipe',
          }
        )
          .toString()
          .trim();

        // parse output
        const result: { Node: string; ProcessId: string }[] = parseCsv(
          resultStr,
          {
            skipEmptyLines: true,
            trim: true,
            columns: true,
          }
        );

        // send result
        if (result.length > 0) {
          reply({
            external: minerPid === null,
            status: 'running',
          });
        } else {
          reply({
            external: false,
            status: 'stopped',
          });
        }
      } catch (err) {
        sendError({ message: 'Failed to get miner status', ...err });
        reply({
          external: false,
          status: 'error',
        });
      }
    }
  }
);

// store.onDidChange('minerPath', () => {});
