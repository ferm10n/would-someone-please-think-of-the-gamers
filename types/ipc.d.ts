import type { OpenDialogOptions, OpenDialogReturnValue } from 'electron';
import type { MinerStatus, Store } from './index';

export type MessageMapItem<
  CARG extends (...args: unknown[]) => void | never,
  SARG extends (...args: unknown[]) => void | never
> = {
  /** if `never`, then there is no client send */
  clientArgs: CARG extends never ? never : Parameters<CARG>;
  /** if `never`, then there is no server send */
  serverArgs: SARG extends never ? never : Parameters<SARG>;
};

export type MessageMap = {
  'get-miner-status': MessageMapItem<
    () => void,
    (minerStatus: MinerStatus) => void
  >;
  'miner-log': MessageMapItem<never, (logItems: string[]) => void>;
  'store-set': MessageMapItem<
    (patchStore: Partial<Store>) => void,
    (patchStoreAck: Partial<Store>) => void
  >;
  /** gets the entire store */
  'get-store': MessageMapItem<() => void, (remoteStore: Store) => void>;
  'store-reset': MessageMapItem<() => void, never>;
  'pick-path': MessageMapItem<
    (pathId: string, opts: OpenDialogOptions) => void,
    (pathId: string, result: OpenDialogReturnValue) => void
  >;
};

export type ClientMessageMap = {
  [CHAN in keyof MessageMap as MessageMap[CHAN]['clientArgs'] extends never
    ? never
    : CHAN]: MessageMap[CHAN];
};
