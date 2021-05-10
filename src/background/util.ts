import { MessageMap } from 'types';
import { BrowserWindow, ipcMain } from 'electron';
import { IpcMainEvent } from 'electron/main';

let win: BrowserWindow | null = null;
export const windowAccessor = {
  get: (): typeof win => win,
  set: (w: BrowserWindow): void => {
    win = w;
  },
};
export default windowAccessor;

/** wraps the IPC main for logging and typed interaction */
export function useIpcMainChannel<CHAN extends keyof MessageMap>(
  channel: CHAN,
  onMessage?: (
    event: IpcMainEvent,
    reply: (...serverArgs: MessageMap[CHAN]['serverArgs']) => void,
    ...clientArgs: MessageMap[CHAN]['clientArgs']
  ) => void
): {
  send: (
    target: Electron.WebContents,
    ...serverArgs: MessageMap[CHAN]['serverArgs']
  ) => void;
} {
  if (onMessage) {
    /** wrapped handler that logs things */
    const wrapCb = (
      event: IpcMainEvent,
      ...clientArgs: MessageMap[CHAN]['clientArgs']
    ) => {
      // when the message is received, log it and then call the cb
      console.log('▼', channel, ...clientArgs);

      // call the cb
      onMessage(
        event,

        // provide a reply method
        (...serverResponseArgs) => {
          console.log('▲', channel, ...serverResponseArgs);
          event.sender.send(channel, ...serverResponseArgs);
        },

        // pass the original args that came with the msg
        ...clientArgs
      );
    };

    // add the binding
    ipcMain.on(
      channel,
      // not sure how to relax tsc with the any[] to tuple type from MessageMap
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      wrapCb as (event: IpcMainEvent, ...args: any[]) => void
    );
  }

  return {
    send: (target, ...serverArgs) => {
      console.log('▲', channel, ...serverArgs);
      target.send(channel, ...serverArgs);
    },
  };
}

const { send: sendErrorRaw } = useIpcMainChannel('server-error');
export function sendError(errorLike: Parameters<typeof sendErrorRaw>[1]): void {
  const winAccVal = windowAccessor.get();
  console.error(errorLike);
  if (winAccVal) {
    sendErrorRaw(winAccVal.webContents, errorLike);
  }
}
