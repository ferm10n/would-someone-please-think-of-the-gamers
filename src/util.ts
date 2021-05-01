import { onUnmounted } from "@vue/runtime-core";
import { IpcRendererEvent } from "electron";

export function useIpcEventHandler<T>(
  eventName: string,
  cb: (event: IpcRendererEvent, args: T) => void
): void {
  window.ipcRenderer.on(eventName, cb);
  onUnmounted(() => window.ipcRenderer.off(eventName, cb));
}
