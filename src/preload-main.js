const { contextBridge, ipcRenderer } = require('electron');

let initInfo = {};
try {
  initInfo = ipcRenderer.sendSync('get-init-info') || {};
} catch (_) {}

contextBridge.exposeInMainWorld('electronAPI', {
  appInfo: {
    version: initInfo.version || '0.17.4',
    appVersion: initInfo.version || '0.17.4',
    platform: initInfo.platform || process.platform,
    arch: initInfo.arch || process.arch,
    electronVersion: initInfo.electronVersion || process.versions.electron || 'N/A',
    chromeVersion: initInfo.chromeVersion || process.versions.chrome || 'N/A'
  },
  webviewPreloadPath: initInfo.webviewPreloadPath || ('file://' + __dirname + '/preload.js'),
  updateTrayBadge: (count) => ipcRenderer.send('update-tray-badge', count),
  setThemeMode: (mode) => ipcRenderer.send('set-theme-mode', mode),
  updatePermissionSettings: (perms) => ipcRenderer.send('update-permission-settings', perms),
  updateTraySettings: (settings) => ipcRenderer.send('update-tray-settings', settings),
  showNativeNotification: (data) => ipcRenderer.send('show-native-notification', data),
  openExternal: (url) => ipcRenderer.send('open-external', url),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectDownloadDirectory: () => ipcRenderer.invoke('select-folder'),
  getDefaultDownloadsPath: () => ipcRenderer.invoke('get-default-downloads-path'),
  resetFolder: () => ipcRenderer.invoke('reset-folder'),
  resetDownloadDirectory: () => ipcRenderer.invoke('reset-folder'),
  setDownloadPath: (dir) => ipcRenderer.invoke('set-download-path', dir),
  onDefaultDownloadsPath: (callback) => {
    if (typeof callback !== 'function') return;
    const handler = (_event, path) => callback(path);
    ipcRenderer.on('default-downloads-path', handler);
    return () => ipcRenderer.removeListener('default-downloads-path', handler);
  },
  getSystemSettings: () => ipcRenderer.invoke('get-system-settings'),
  setSpellcheckerLanguage: (lang) => ipcRenderer.invoke('set-spellchecker-language', lang),
  updateNetworkSettings: (settings) => ipcRenderer.invoke('update-network-settings', settings),
  getNetworkSettings: () => ipcRenderer.invoke('get-network-settings'),
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  loadLocale: (lang) => ipcRenderer.invoke('load-locale', lang),
  onSelectAccount: (callback) => {
    if (typeof callback !== 'function') return;
    const handler = (_event, accountId) => callback(accountId);
    ipcRenderer.on('select-account', handler);
    return () => ipcRenderer.removeListener('select-account', handler);
  }
});
