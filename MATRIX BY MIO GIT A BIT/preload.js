const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('ledgerApp', {
  restart: () => ipcRenderer.invoke('app:restart'),
  overlay: (mode) => ipcRenderer.invoke('win:overlay', mode)
});
