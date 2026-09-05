const { contextBridge, ipcRenderer } = require('electron');

let initInfo = {};
try {
  initInfo = ipcRenderer.sendSync('get-init-info') || {};
} catch (_) {}

contextBridge.exposeInMainWorld('electronAPI', {
  appInfo: {
    version: initInfo.version || '1.4.1',
    appVersion: initInfo.version || '1.4.1',
    platform: initInfo.platform || (typeof process !== 'undefined' ? process.platform : 'linux'),
    arch: initInfo.arch || (typeof process !== 'undefined' ? process.arch : 'x64'),
    electronVersion: initInfo.electronVersion || (typeof process !== 'undefined' && process.versions ? process.versions.electron : 'N/A'),
    chromeVersion: initInfo.chromeVersion || (typeof process !== 'undefined' && process.versions ? process.versions.chrome : 'N/A')
  },
  webviewPreloadPath: initInfo.webviewPreloadPath || ('file://' + (typeof __dirname !== 'undefined' ? __dirname : '') + '/preload.js'),
  systemIsDark: typeof initInfo.systemIsDark === 'boolean' ? initInfo.systemIsDark : true,
  getSystemTheme: () => ipcRenderer.invoke('get-system-theme'),
  onSystemThemeUpdated: (callback) => {
    if (typeof callback !== 'function') return;
    const handler = (_event, isDark) => callback(isDark);
    ipcRenderer.on('system-theme-updated', handler);
    return () => ipcRenderer.removeListener('system-theme-updated', handler);
  },
  updateTrayBadge: (count) => ipcRenderer.send('update-tray-badge', count),
  setThemeMode: (mode) => ipcRenderer.send('set-theme-mode', mode),
  updatePermissionSettings: (perms) => ipcRenderer.send('update-permission-settings', perms),
  updateTraySettings: (settings) => ipcRenderer.send('update-tray-settings', settings),
  showNativeNotification: (data) => ipcRenderer.send('show-native-notification', data),
  openExternal: (url) => ipcRenderer.send('open-external', url),
  openExternalUrl: (url) => ipcRenderer.invoke('open-external-url', url),
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
  setSpellcheckerLanguage: (lang) => ipcRenderer.invoke('set-spellchecker-languages', Array.isArray(lang) ? lang : [lang]),
  setSpellcheckerLanguages: (langs) => ipcRenderer.invoke('set-spellchecker-languages', Array.isArray(langs) ? langs : [langs]),
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  loadLocale: (lang) => ipcRenderer.invoke('load-locale', lang),
  getAccounts: () => ipcRenderer.invoke('get-accounts'),
  saveAccounts: (accounts) => ipcRenderer.invoke('save-accounts', accounts),
  deleteAccountData: (accountId) => ipcRenderer.invoke('delete-account-data', accountId),
  clearAccountCache: (accountId) => ipcRenderer.invoke('clear-account-cache', accountId),
  onSelectAccount: (callback) => {
    if (typeof callback !== 'function') return;
    const handler = (_event, accountId) => callback(accountId);
    ipcRenderer.on('select-account', handler);
    return () => ipcRenderer.removeListener('select-account', handler);
  },
  updater: {
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    downloadUpdate: () => ipcRenderer.invoke('download-update'),
    installUpdate: () => ipcRenderer.invoke('install-update'),
    onUpdateAvailable: (callback) => {
      if (typeof callback !== 'function') return;
      const handler = (_event, info) => callback(info);
      ipcRenderer.on('update-available', handler);
      return () => ipcRenderer.removeListener('update-available', handler);
    },
    onUpdateNotAvailable: (callback) => {
      if (typeof callback !== 'function') return;
      const handler = (_event, info) => callback(info);
      ipcRenderer.on('update-not-available', handler);
      return () => ipcRenderer.removeListener('update-not-available', handler);
    },
    onDownloadProgress: (callback) => {
      if (typeof callback !== 'function') return;
      const handler = (_event, progressObj) => callback(progressObj);
      ipcRenderer.on('download-progress', handler);
      return () => ipcRenderer.removeListener('download-progress', handler);
    },
    onUpdateDownloaded: (callback) => {
      if (typeof callback !== 'function') return;
      const handler = (_event, info) => callback(info);
      ipcRenderer.on('update-downloaded', handler);
      return () => ipcRenderer.removeListener('update-downloaded', handler);
    },
    onError: (callback) => {
      if (typeof callback !== 'function') return;
      const handler = (_event, error) => callback(error);
      ipcRenderer.on('update-error', handler);
      return () => ipcRenderer.removeListener('update-error', handler);
    }
  }
});
