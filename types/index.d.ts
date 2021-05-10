export * from './ipc';

export type Store = {
  minerPath: string;
  minerArgs: string[];
};

export type MinerStatus = {
  status: 'running' | 'stopped' | 'unknown';
  /** whether or not the miner was started by the controller, or by the user */
  external: boolean;
};
