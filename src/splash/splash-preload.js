const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('splashAPI', {
  getAppVersion: () => {
    try {
      return ipcRenderer.sendSync('get-app-version');
    } catch (_) {
      return null;
    }
  },
  finishSplash: () => {
    ipcRenderer.send('splash-finished');
  }
});
