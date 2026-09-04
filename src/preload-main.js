const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const pkg = require('../package.json');

contextBridge.exposeInMainWorld('electronAPI', {
  appInfo: {
    version: pkg.version || '0.13.1',
    platform: process.platform,
    arch: process.arch,
    electronVersion: process.versions.electron || 'N/A',
    chromeVersion: process.versions.chrome || 'N/A'
  },
  webviewPreloadPath: 'file://' + path.join(__dirname, 'preload.js'),
  updateTrayBadge: (count) => ipcRenderer.send('update-tray-badge', count),
  setThemeMode: (mode) => ipcRenderer.send('set-theme-mode', mode),
  updatePermissionSettings: (perms) => ipcRenderer.send('update-permission-settings', perms),
  updateTraySettings: (settings) => ipcRenderer.send('update-tray-settings', settings),
  showNativeNotification: (data) => ipcRenderer.send('show-native-notification', data),
  openExternal: (url) => ipcRenderer.send('open-external', url),
  openExternalUrl: (url) => ipcRenderer.invoke('open-external-url', url),
  selectDownloadDirectory: () => ipcRenderer.invoke('select-download-directory'),
  getDefaultDownloadsPath: () => ipcRenderer.invoke('get-default-downloads-path'),
  resetDownloadDirectory: () => ipcRenderer.invoke('reset-download-directory'),
  setDownloadPath: (dir) => ipcRenderer.invoke('set-download-path', dir),
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
