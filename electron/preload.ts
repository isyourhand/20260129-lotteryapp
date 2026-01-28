import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  loadXlsx: (path: string) =>
    ipcRenderer.invoke("load-xlsx", path),
});
