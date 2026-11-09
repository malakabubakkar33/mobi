const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mobiDesktop', {
  isElectron: true,
  platform: process.platform,
  navigateUrl: (url) => ipcRenderer.send('mobi:navigate', url),
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
});

