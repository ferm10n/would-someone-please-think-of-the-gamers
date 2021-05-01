import { ipcMain, dialog, OpenDialogOptions } from "electron";

ipcMain.on("pick-path", (event, [id, opts]: [string, OpenDialogOptions]) => {
  dialog.showOpenDialog(opts).then((val) => {
    event.sender.send("pick-path-reply", [id, val]);
  });
});
