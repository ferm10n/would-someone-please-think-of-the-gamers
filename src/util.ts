import { onUnmounted } from '@vue/composition-api';
import { IpcRendererEvent } from 'electron';

export function useIpcEventHandler<T>(
  eventName: string,
  cb: (event: IpcRendererEvent, args: T) => void
): void {
  if ('ipcRenderer' in window) {
    window.ipcRenderer.on(eventName, cb);
    onUnmounted(() => window.ipcRenderer.off(eventName, cb));
  }
}
