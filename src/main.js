const { app, BrowserWindow, Menu, Tray, ipcMain, nativeImage, nativeTheme, Notification, session, dialog, shell, webContents } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

// Configure autoUpdater logging with electron-log
autoUpdater.logger = log;
if (autoUpdater.logger.transports && autoUpdater.logger.transports.file) {
  autoUpdater.logger.transports.file.level = 'info';
}
autoUpdater.autoDownload = false;

// 3. Flags de optimización de Chromium
app.commandLine.appendSwitch('disable-features', 'HardwareMediaKeyHandling,MediaSessionService,WaylandWpColorManagerV1');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

// 1. Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Focus original window if user attempts to launch second instance
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

const APP_ICON_PATH = path.join(__dirname, 'assets', 'img', 'icon.png');
const APP_USER_MODEL_ID = 'com.sentinelstudio.whatsnexus';

// Set Application User Model ID for Windows taskbar grouping and notification attribution
if (process.platform === 'win32') {
  app.setAppUserModelId(APP_USER_MODEL_ID);
}

let mainWindow;
let splashWindow = null;
let tray = null;

function createSplashWindow() {
  try {
    splashWindow = new BrowserWindow({
      width: 480,
      height: 300,
      frame: false,
      resizable: false,
      transparent: process.platform !== 'linux',
      backgroundColor: '#111b21',
      alwaysOnTop: true,
      center: true,
      show: true,
      icon: APP_ICON_PATH,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        preload: path.join(__dirname, 'splash', 'splash-preload.js')
      }
    });

    splashWindow.loadFile(path.join(__dirname, 'splash', 'splash.html'));

    splashWindow.once('ready-to-show', () => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.show();
        splashWindow.focus();
      }
    });

    splashWindow.on('closed', () => {
      splashWindow = null;
    });
  } catch (err) {
    console.error('Error creating splash window:', err);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
    }
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // Preloaded in background while splash is animating
    title: 'WhatsNexus',
    icon: APP_ICON_PATH,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webviewTag: true, // CRITICAL: This allows the use of <webview> tags for session isolation
      backgroundThrottling: true, // Ensure background throttling
      preload: path.join(__dirname, 'preload-main.js')
    }
  });

  // Load the index.html of the app
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Send default downloads path to renderer once load finishes
  mainWindow.webContents.on('did-finish-load', () => {
    const defaultDownloads = currentSystemSettings.downloadPath || app.getPath('downloads');
    mainWindow.webContents.send('default-downloads-path', defaultDownloads);
  });

  // Hide the menu bar for a cleaner look
  mainWindow.setMenuBarVisibility(false);

  mainWindow.webContents.on('console-message', (event, level, message, line) => {
    if (level >= 2) {
      console.log(`[Renderer ${level === 3 ? 'Error' : 'Warn'}]: ${message} (line: ${line})`);
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isSafeExternalUrl(url)) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('did-attach-webview', (event, wc) => {
    if (wc && wc.session) {
      configureSession(wc.session);
    }
  });

  mainWindow.on('close', function (event) {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });
}

// Splash transition is governed strictly by the 5000ms timer in app.whenReady
ipcMain.on('splash-finished', () => {
  // Gracefully ignored; master 5000ms timer controls the transition
});

// Provide current dynamic application version
ipcMain.on('get-app-version', (event) => {
  event.returnValue = app.getVersion();
});

ipcMain.on('get-init-info', (event) => {
  event.returnValue = {
    version: app.getVersion(),
    platform: process.platform,
    arch: process.arch,
    electronVersion: process.versions.electron || 'N/A',
    chromeVersion: process.versions.chrome || 'N/A',
    systemIsDark: nativeTheme.shouldUseDarkColors,
    webviewPreloadPath: 'file://' + path.join(__dirname, 'preload.js')
  };
});

let currentTraySettings = {
  style: 'auto',
  showBadge: true
};
let currentUnreadCount = 0;

function getTrayIconPath(unreadCount = 0, style = 'auto', showBadge = true) {
  let filename = 'tray-green.png';
  if (style === 'light') filename = 'tray-light.png';
  else if (style === 'dark') filename = 'tray-dark.png';

  if (showBadge && unreadCount > 0) {
    if (style === 'light') filename = 'tray-light-badge.png';
    else if (style === 'dark') filename = 'tray-dark-badge.png';
    else filename = 'tray-green-badge.png';
  }

  return path.join(__dirname, 'assets', 'img', filename);
}

function updateTrayImage() {
  if (!tray) return;
  try {
    const iconPath = getTrayIconPath(currentUnreadCount, currentTraySettings.style, currentTraySettings.showBadge);
    tray.setImage(iconPath);
    tray.setToolTip(currentUnreadCount > 0 ? `WhatsNexus (${currentUnreadCount} sin leer)` : 'WhatsNexus');
  } catch (_) {}
}

function createTray() {
  if (tray) return;

  try {
    const iconPath = getTrayIconPath(currentUnreadCount, currentTraySettings.style, currentTraySettings.showBadge);
    tray = new Tray(iconPath);
    tray.setToolTip('WhatsNexus');

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Mostrar WhatsNexus',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Salir',
        click: () => {
          app.isQuitting = true;
          app.quit();
        }
      }
    ]);
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          if (mainWindow.isFocused()) {
            mainWindow.hide();
          } else {
            mainWindow.focus();
          }
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    });
  } catch (err) {
    console.warn('[Tray Warning]: Failed to initialize system tray (KDE/Wayland fallback):', err.message);
  }
}

// IPC to update notification unread counter / tray badge
ipcMain.on('update-tray-badge', (event, count) => {
  currentUnreadCount = Math.max(0, parseInt(count, 10) || 0);
  updateTrayImage();
});

// IPC to update tray appearance (icon style and badge counter visibility)
ipcMain.on('update-tray-settings', (event, settings) => {
  if (settings) {
    if (settings.style !== undefined) currentTraySettings.style = settings.style;
    if (settings.showBadge !== undefined) currentTraySettings.showBadge = settings.showBadge;
    updateTrayImage();
  }
});

// IPC to synchronize theme mode (dark/light/system) at Chromium system level
ipcMain.on('set-theme-mode', (event, mode) => {
  if (mode === 'dark' || mode === 'light' || mode === 'system') {
    nativeTheme.themeSource = mode;
  }
});

ipcMain.handle('get-system-theme', () => {
  return {
    shouldUseDarkColors: nativeTheme.shouldUseDarkColors,
    themeSource: nativeTheme.themeSource
  };
});

nativeTheme.on('updated', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('system-theme-updated', nativeTheme.shouldUseDarkColors);
  }
});

// IPC to dispatch native notification with in-memory circular avatar (RAM-only, zero disk I/O)
ipcMain.on('show-native-notification', (event, data) => {
  if (!Notification.isSupported()) return;

  let icon = APP_ICON_PATH;

  // If a base64 circular avatar was provided, construct NativeImage directly in RAM
  if (data.iconDataUrl && typeof data.iconDataUrl === 'string' && data.iconDataUrl.startsWith('data:image/')) {
    try {
      const img = nativeImage.createFromDataURL(data.iconDataUrl);
      if (!img.isEmpty()) {
        icon = img;
      }
    } catch (e) {
      console.error('Error creating notification circular avatar in RAM:', e);
    }
  }

  const notification = new Notification({
    title: data.title || 'WhatsNexus',
    body: data.body || '',
    icon: icon,
    silent: !!data.silent
  });

  notification.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
      if (data.accountId) {
        mainWindow.webContents.send('select-account', data.accountId);
      }
    }
  });

  notification.show();
});

let currentPermissions = {
  notifications: true,
  microphone: true,
  camera: false,
  location: false,
  screenShare: true,
  screenShareAudio: false
};

function getPermissionsFilePath() {
  return path.join(app.getPath('userData'), 'permissions.json');
}

function loadSavedPermissions() {
  try {
    const filePath = getPermissionsFilePath();
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      currentPermissions = { ...currentPermissions, ...data };
      if (typeof currentPermissions.notifications !== 'boolean') {
        currentPermissions.notifications = true;
      }
    }
  } catch (_) {}
}

function savePermissions() {
  try {
    const filePath = getPermissionsFilePath();
    fs.writeFileSync(filePath, JSON.stringify(currentPermissions, null, 2), 'utf8');
  } catch (_) {}
}

function broadcastPermissionsToAllWebContents(perms) {
  const allWc = webContents.getAllWebContents();
  for (const wc of allWc) {
    if (!wc.isDestroyed()) {
      try {
        wc.send('update-permission-settings', perms);
        wc.send('permissions:updated', perms);
      } catch (_) {}
    }
  }
}

ipcMain.on('update-permission-settings', (event, permissions) => {
  if (permissions) {
    currentPermissions = { ...currentPermissions, ...permissions };
    savePermissions();
    broadcastPermissionsToAllWebContents(currentPermissions);
  }
});

ipcMain.on('permissions:updated', (event, permissions) => {
  if (permissions) {
    currentPermissions = { ...currentPermissions, ...permissions };
    savePermissions();
    broadcastPermissionsToAllWebContents(currentPermissions);
  }
});

ipcMain.on('notifications:updated', (event, notifSettings) => {
  if (notifSettings) {
    if (typeof notifSettings.desktopNotifications === 'boolean') {
      currentPermissions.notifications = notifSettings.desktopNotifications;
      savePermissions();
    }
    const allWc = webContents.getAllWebContents();
    for (const wc of allWc) {
      if (!wc.isDestroyed()) {
        try {
          wc.send('update-notification-settings', notifSettings);
          wc.send('notifications:updated', notifSettings);
        } catch (_) {}
      }
    }
  }
});

// Accounts configuration and persistence in userData directory
let currentAccounts = [];

function getAccountsFilePath() {
  return path.join(app.getPath('userData'), 'accounts.json');
}

function loadSavedAccounts() {
  try {
    const filePath = getAccountsFilePath();
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (Array.isArray(data)) {
        currentAccounts = data;
        return currentAccounts;
      }
    }
  } catch (err) {
    console.error('Error loading accounts from userData:', err);
  }
  return [];
}

function saveAccountsToUserData(accounts) {
  try {
    const filePath = getAccountsFilePath();
    fs.writeFileSync(filePath, JSON.stringify(accounts, null, 2), 'utf8');
    currentAccounts = accounts;
    return true;
  } catch (err) {
    console.error('Error saving accounts to userData:', err);
    return false;
  }
}

ipcMain.handle('get-accounts', () => {
  return loadSavedAccounts();
});

ipcMain.handle('save-accounts', (_event, accounts) => {
  if (Array.isArray(accounts)) {
    accounts.forEach(acc => {
      const partition = acc.partition || (acc.id && (acc.id.startsWith('persist:') ? acc.id : `persist:${acc.id}`));
      if (partition) {
        try {
          const ses = session.fromPartition(partition);
          configureSession(ses);
        } catch (_) {}
      }
    });
    return saveAccountsToUserData(accounts);
  }
  return false;
});

ipcMain.handle('delete-account-data', async (_event, accountId) => {
  try {
    if (!accountId) return { success: false, error: 'Invalid account ID' };
    const accounts = loadSavedAccounts();
    const updated = accounts.filter(a => a.id !== accountId);
    saveAccountsToUserData(updated);

    const partition = accountId.startsWith('persist:') ? accountId : `persist:${accountId}`;
    const ses = session.fromPartition(partition);
    if (ses) {
      await ses.clearStorageData();
      await ses.clearCache();
    }
    return { success: true };
  } catch (err) {
    console.error('Error deleting account data:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('clear-account-cache', async (_event, accountId) => {
  try {
    if (!accountId) return { success: false, error: 'Invalid account ID' };
    const partition = accountId.startsWith('persist:') ? accountId : `persist:${accountId}`;
    const ses = session.fromPartition(partition);
    if (ses) {
      await ses.clearCache();
      await ses.clearStorageData({
        storages: ['appcache', 'filesystem', 'shadercache', 'serviceworkers', 'cachestorage']
      });
      return { success: true };
    }
    return { success: false, error: 'Session not found' };
  } catch (err) {
    console.error('Error clearing account cache:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('check-internet', async (event, customUrl) => {
  const https = require('https');
  const { net } = require('electron');

  // Fast check: Electron net.isOnline()
  if (typeof net !== 'undefined' && typeof net.isOnline === 'function') {
    if (!net.isOnline()) {
      return false;
    }
  }

  const targetUrl = customUrl || 'https://web.whatsapp.com';

  const checkUrl = (urlStr) => {
    return new Promise((resolve) => {
      try {
        const parsed = new URL(urlStr);
        const req = https.request({
          protocol: parsed.protocol,
          hostname: parsed.hostname,
          port: parsed.port || 443,
          path: parsed.pathname || '/',
          method: 'HEAD',
          timeout: 4500,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        }, (res) => {
          // Strict HTTP 200 to 299 range as required
          resolve(res.statusCode >= 200 && res.statusCode <= 299);
        });
        req.on('error', () => resolve(false));
        req.on('timeout', () => {
          req.destroy();
          resolve(false);
        });
        req.end();
      } catch (_) {
        resolve(false);
      }
    });
  };

  let isOk = await checkUrl(targetUrl);
  if (!isOk && targetUrl !== 'https://github.com') {
    isOk = await checkUrl('https://github.com');
  }
  return isOk;
});

// System Configuration (Downloads and Spellchecker)
let currentSystemSettings = {
  downloadPath: '',
  spellcheckLanguages: ['es-ES']
};

function getSystemSettingsFilePath() {
  return path.join(app.getPath('userData'), 'system_settings.json');
}

// Fallback mapping for backwards compatibility
const SPELLCHECK_MAP = {
  en: 'en-US',
  zh: 'zh-CN',
  hi: 'hi',
  es: 'es-ES',
  fr: 'fr-FR',
  ar: 'ar',
  bn: 'bn',
  pt: 'pt-BR',
  ru: 'ru',
  ur: 'ur',
  id: 'id',
  de: 'de-DE',
  ja: 'ja',
  mr: 'mr',
  te: 'te',
  tr: 'tr',
  ta: 'ta',
  yue: 'zh-TW',
  vi: 'vi',
  fil: 'fil',
  ko: 'ko',
  fa: 'fa',
  ha: 'ha',
  sw: 'sw',
  it: 'it'
};

function loadSavedSystemSettings() {
  try {
    const filePath = getSystemSettingsFilePath();
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (Array.isArray(data.spellcheckLanguages)) {
        const LEGACY_MAP = {
          'es': 'es-ES',
          'fr': 'fr-FR',
          'de': 'de-DE',
          'it-IT': 'it',
          'ru-RU': 'ru'
        };
        currentSystemSettings.spellcheckLanguages = Array.from(new Set(
          data.spellcheckLanguages.map(c => LEGACY_MAP[c] || c)
        ));
      } else if (typeof data.spellcheckLanguage === 'string') {
        const mapped = SPELLCHECK_MAP[data.spellcheckLanguage] || data.spellcheckLanguage || 'es-ES';
        currentSystemSettings.spellcheckLanguages = [mapped];
      }
      if (data.downloadPath) {
        currentSystemSettings.downloadPath = data.downloadPath;
      }
    }
  } catch (_) {}
  if (!currentSystemSettings.downloadPath) {
    try {
      currentSystemSettings.downloadPath = app.getPath('downloads');
    } catch (_) {}
  }
}

function saveSystemSettings() {
  try {
    const filePath = getSystemSettingsFilePath();
    fs.writeFileSync(filePath, JSON.stringify(currentSystemSettings, null, 2), 'utf8');
  } catch (_) {}
}

/**
 * Elimina físicamente del disco los archivos .bdic correspondientes a los idiomas desmarcados.
 * Busca en la carpeta Dictionaries de userData y en particiones existentes.
 */
function removeDictionariesForLanguages(removedLangs) {
  if (!Array.isArray(removedLangs) || removedLangs.length === 0) return;
  try {
    const userDataPath = app.getPath('userData');
    const dirsToScan = [];
    const mainDictDir = path.join(userDataPath, 'Dictionaries');
    if (fs.existsSync(mainDictDir)) {
      dirsToScan.push(mainDictDir);
    }
    const partitionsDir = path.join(userDataPath, 'Partitions');
    if (fs.existsSync(partitionsDir)) {
      try {
        const subdirs = fs.readdirSync(partitionsDir);
        for (const sub of subdirs) {
          const subDict = path.join(partitionsDir, sub, 'Dictionaries');
          if (fs.existsSync(subDict)) {
            dirsToScan.push(subDict);
          }
        }
      } catch (_) {}
    }

    for (const dir of dirsToScan) {
      if (!fs.existsSync(dir)) continue;
      let files = [];
      try {
        files = fs.readdirSync(dir);
      } catch (_) {
        continue;
      }

      for (const lang of removedLangs) {
        if (!lang || typeof lang !== 'string') continue;
        const cleanLang = lang.trim().toLowerCase();
        for (const file of files) {
          if (!file.toLowerCase().endsWith('.bdic')) continue;
          const fileNameLower = file.toLowerCase();
          if (
            fileNameLower.startsWith(cleanLang + '-') ||
            fileNameLower.startsWith(cleanLang + '.') ||
            fileNameLower === `${cleanLang}.bdic`
          ) {
            try {
              const fullPath = path.join(dir, file);
              fs.unlinkSync(fullPath);
              console.log(`[Spellchecker Disk Cleanup] Removed dictionary file: ${fullPath}`);
            } catch (_) {
              // Silent fallback on locked files or permissions
            }
          }
        }
      }
    }
  } catch (_) {
    // Silent fallback
  }
}

const activeSessions = new Set();

function applySpellChecker(ses, languages) {
  if (!ses) return;
  const langs = Array.isArray(languages) ? languages : [languages || 'es-ES'];
  const validLangs = langs.filter(l => typeof l === 'string' && l.trim().length > 0);
  try {
    ses.setSpellCheckerLanguages(validLangs);
  } catch (err) {
    console.error('[Spellchecker Error]:', err);
  }
}

function updateSpellCheckerAllSessions(languages) {
  applySpellChecker(session.defaultSession, languages);
  for (const ses of activeSessions) {
    applySpellChecker(ses, languages);
  }
}

// Intercept session downloads to save them to user-selected path
function configureSessionDownloads(ses) {
  if (!ses) return;
  ses.on('will-download', (event, item, webContents) => {
    let rutaGuardada = currentSystemSettings.downloadPath;
    if (!rutaGuardada) {
      try {
        rutaGuardada = app.getPath('downloads');
      } catch (_) {}
    }
    if (rutaGuardada) {
      try {
        if (!fs.existsSync(rutaGuardada)) {
          fs.mkdirSync(rutaGuardada, { recursive: true });
        }
      } catch (err) {
        console.error('[will-download Error]: No se pudo asegurar la ruta de descargas:', err);
      }
      const targetFile = path.join(rutaGuardada, item.getFilename());
      console.log('Descargando en:', rutaGuardada);
      item.setSavePath(targetFile);
    }
  });
}

function isSafeExternalUrl(rawUrl) {
  if (typeof rawUrl !== 'string') return false;
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    // Block embedded credentials (e.g. user:pass@host)
    if (parsed.username || parsed.password) {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname === '[::1]' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('169.254.')
    ) {
      return false;
    }
    return true;
  } catch (_) {
    return false;
  }
}

ipcMain.on('open-external', (event, url) => {
  if (isSafeExternalUrl(url)) {
    shell.openExternal(url);
  } else {
    console.warn(`[Security Warning]: Blocked dangerous external URL: ${url}`);
  }
});

ipcMain.handle('open-external-url', async (event, url) => {
  if (isSafeExternalUrl(url)) {
    try {
      await shell.openExternal(url);
      return true;
    } catch (_) {}
  } else {
    console.warn(`[Security Warning]: Blocked dangerous external URL: ${url}`);
  }
  return false;
});

async function handleSelectDownloadFolder() {
  const defaultDir = currentSystemSettings.downloadPath || app.getPath('downloads');
  const win = BrowserWindow.getFocusedWindow() || mainWindow;
  const result = await dialog.showOpenDialog(win, {
    title: 'Seleccionar Carpeta de Descargas',
    defaultPath: defaultDir,
    properties: ['openDirectory']
  });

  if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
    const selected = result.filePaths[0];
    currentSystemSettings.downloadPath = selected;
    saveSystemSettings();
    return selected;
  }
  return null;
}

function handleResetDownloadFolder() {
  const defaultDir = app.getPath('downloads');
  currentSystemSettings.downloadPath = defaultDir;
  saveSystemSettings();
  return defaultDir;
}

ipcMain.handle('select-folder', async () => handleSelectDownloadFolder());
ipcMain.handle('select-download-directory', async () => handleSelectDownloadFolder());

ipcMain.handle('reset-folder', () => handleResetDownloadFolder());
ipcMain.handle('reset-download-directory', () => handleResetDownloadFolder());

ipcMain.handle('get-default-downloads-path', () => {
  return app.getPath('downloads');
});

ipcMain.handle('set-download-path', (event, newPath) => {
  if (typeof newPath === 'string' && newPath.trim()) {
    currentSystemSettings.downloadPath = newPath.trim();
    saveSystemSettings();
  }
  return currentSystemSettings.downloadPath;
});

ipcMain.handle('get-system-settings', () => {
  return {
    downloadPath: currentSystemSettings.downloadPath || app.getPath('downloads'),
    spellcheckLanguages: currentSystemSettings.spellcheckLanguages || ['es-ES'],
    spellcheckLanguage: (currentSystemSettings.spellcheckLanguages && currentSystemSettings.spellcheckLanguages[0]) || 'es-ES'
  };
});

ipcMain.handle('set-spellchecker-languages', (event, languages) => {
  if (Array.isArray(languages)) {
    const previous = currentSystemSettings.spellcheckLanguages || [];
    const removed = previous.filter(l => !languages.includes(l));
    if (removed.length > 0) {
      removeDictionariesForLanguages(removed);
    }
    currentSystemSettings.spellcheckLanguages = languages;
    saveSystemSettings();
    updateSpellCheckerAllSessions(languages);
  }
  return true;
});

ipcMain.handle('set-spellchecker-language', (event, langCode) => {
  if (typeof langCode === 'string') {
    const langs = [langCode];
    const previous = currentSystemSettings.spellcheckLanguages || [];
    const removed = previous.filter(l => !langs.includes(l));
    if (removed.length > 0) {
      removeDictionariesForLanguages(removed);
    }
    currentSystemSettings.spellcheckLanguages = langs;
    saveSystemSettings();
    updateSpellCheckerAllSessions(langs);
  }
  return true;
});

ipcMain.handle('get-system-info', () => {
  const currentAppVersion = app.getVersion();
  return {
    version: currentAppVersion,
    appVersion: currentAppVersion,
    electron: process.versions.electron || 'N/A',
    chrome: process.versions.chrome || 'N/A',
    node: process.versions.node || 'N/A',
    v8: process.versions.v8 || 'N/A',
    osType: os.type(),
    osRelease: os.release(),
    osArch: os.arch(),
    platform: process.platform
  };
});

const localeCache = new Map();

ipcMain.handle('load-locale', async (event, langCode) => {
  if (!langCode || typeof langCode !== 'string') langCode = 'en';
  const cleanCode = langCode.trim();
  const safeLang = cleanCode.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();

  // In-memory cache hit to eliminate disk read latency
  if (localeCache.has(safeLang)) {
    return localeCache.get(safeLang);
  }

  // Exact match or fallback to base language code (e.g. zh-CN -> zh)
  const baseCode = safeLang.split('-')[0].split('_')[0];
  const candidates = [
    `${safeLang}.json`,
    `${cleanCode}.json`,
    `${baseCode}.json`
  ];

  let resolvedPath = null;
  for (const filename of candidates) {
    const p = path.join(__dirname, 'locales', filename);
    try {
      await fs.promises.access(p, fs.constants.R_OK);
      resolvedPath = p;
      break;
    } catch (_) {}
  }

  if (!resolvedPath) {
    console.error(`[Locale Load Error - Path]: File not found for code "${langCode}". Looked in directory: ${path.join(__dirname, 'locales')}`);
    return null;
  }

  try {
    const rawContent = await fs.promises.readFile(resolvedPath, 'utf8');
    try {
      const parsed = JSON.parse(rawContent);
      localeCache.set(safeLang, parsed);
      return parsed;
    } catch (parseErr) {
      console.error(`[Locale Load Error - JSON Parse]: JSON parse error in file ${resolvedPath}:`, parseErr);
      return null;
    }
  } catch (fsErr) {
    console.error(`[Locale Load Error - File Read]: File read error at path ${resolvedPath}:`, fsErr);
    return null;
  }
});

// Themes Loader with Dynamic Validation and Tier Protection
const OFFICIAL_THEME_IDS = new Set([
  'whatsnexus', 'highcontrast', 'forest', 'cybernexus',
  'dracula', 'nord', 'retro', 'steampunk',
  'messenger', 'signal', 'telegram', 'whatsapp',
  'doom', 'startrek', 'starwars', 'voxel'
]);

// Built-in Base Theme Fallback (Guaranteed available even on severe filesystem degradation)
const FALLBACK_BASE_THEME = {
  id: 'whatsnexus',
  nameKey: 'palette_whatsnexus',
  category: 'own',
  builtin: true,
  labels: {
    light: 'theme_light',
    dark: 'theme_dark'
  },
  modes: {
    dark: {
      '--bg-primary': '#151c17',
      '--bg-sidebar': '#1e2922',
      '--bg-hover': '#2b3b31',
      '--bg-active': '#4c9e5f',
      '--bg-modal': '#1e2922',
      '--bg-modal-overlay': 'rgba(18, 26, 20, 0.85)',
      '--text-primary': '#edf4ef',
      '--text-secondary': '#9cb0a2',
      '--text-color': 'var(--text-primary)',
      '--border-color': '#2d3d33',
      '--whatsapp-bg': '#111813',
      '--whatsapp-green': '#4c9e5f',
      '--whatsapp-green-hover': '#3d834e',
      '--bg-surface': 'var(--bg-sidebar)',
      '--accent-color': 'var(--bg-active)',
      '--accent-hover': 'var(--whatsapp-green-hover)',
      '--text-on-accent': '#ffffff',
      '--accent-secondary': '#6e9e4c',
      '--accent-terracotta': '#9e624c',
      '--accent-crimson': '#9e4c53'
    },
    light: {
      '--bg-primary': '#f3f6f4',
      '--bg-sidebar': '#ffffff',
      '--bg-hover': '#e8eee9',
      '--bg-active': '#3f8851',
      '--bg-modal': '#ffffff',
      '--bg-modal-overlay': 'rgba(243, 246, 244, 0.85)',
      '--text-primary': '#152219',
      '--text-secondary': '#506456',
      '--text-color': 'var(--text-primary)',
      '--border-color': '#d6e0d8',
      '--whatsapp-bg': '#ebf0ec',
      '--whatsapp-green': '#3f8851',
      '--whatsapp-green-hover': '#347243',
      '--bg-surface': 'var(--bg-sidebar)',
      '--accent-color': 'var(--bg-active)',
      '--accent-hover': 'var(--whatsapp-green-hover)',
      '--text-on-accent': '#ffffff',
      '--accent-secondary': '#5c8c3e',
      '--accent-terracotta': '#9e624c',
      '--accent-crimson': '#9e4c53'
    }
  }
};

let cachedThemes = null;

ipcMain.handle('load-themes', async () => {
  if (cachedThemes && Array.isArray(cachedThemes) && cachedThemes.length > 0) {
    return cachedThemes;
  }

  // Candidate paths to resolve themes folder robustly across development, app.asar, and unpacked distributions
  const candidateDirs = [
    path.join(app.getAppPath(), 'src', 'themes'),
    path.join(__dirname, 'themes'),
    path.join(process.resourcesPath, 'src', 'themes'),
    path.join(process.resourcesPath, 'themes'),
    path.join(process.resourcesPath, 'app.asar', 'src', 'themes')
  ];

  let themesDir = null;
  for (const candidate of candidateDirs) {
    try {
      if (fs.existsSync(candidate)) {
        themesDir = candidate;
        break;
      }
    } catch (_) {}
  }

  if (!themesDir) {
    themesDir = path.join(app.getAppPath(), 'src', 'themes');
  }

  const validatedThemes = [];

  try {
    let files = [];
    try {
      files = await fs.promises.readdir(themesDir);
    } catch (_) {
      files = fs.readdirSync(themesDir);
    }

    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const filePath = path.join(themesDir, file);

      try {
        let raw;
        try {
          raw = await fs.promises.readFile(filePath, 'utf8');
        } catch (_) {
          raw = fs.readFileSync(filePath, 'utf8');
        }

        let theme;
        try {
          theme = JSON.parse(raw);
        } catch (jsonErr) {
          console.warn(`[Theme Engine Warning]: Skipping malformed JSON theme file: ${file}`, jsonErr.message);
          continue;
        }

        // Validate mandatory schema fields
        if (
          !theme ||
          typeof theme.id !== 'string' ||
          !theme.id.trim() ||
          typeof theme.nameKey !== 'string' ||
          typeof theme.category !== 'string' ||
          !theme.labels ||
          typeof theme.labels.light !== 'string' ||
          typeof theme.labels.dark !== 'string' ||
          !theme.modes ||
          typeof theme.modes.light !== 'object' ||
          typeof theme.modes.dark !== 'object'
        ) {
          console.warn(`[Theme Engine Warning]: Theme file ${file} does not meet schema requirements.`);
          continue;
        }

        // Validate that core tokens are present
        const requiredTokens = ['--bg-primary', '--bg-sidebar', '--text-primary', '--border-color'];
        const hasLightTokens = requiredTokens.every(k => typeof theme.modes.light[k] === 'string');
        const hasDarkTokens = requiredTokens.every(k => typeof theme.modes.dark[k] === 'string');
        if (!hasLightTokens || !hasDarkTokens) {
          console.warn(`[Theme Engine Warning]: Theme ${theme.id} missing mandatory color tokens.`);
          continue;
        }

        // Tier 1 & Tier 2 Protection:
        // Only official built-in themes can be assigned to "own" or "custom"
        if (theme.category === 'own' || theme.category === 'custom') {
          if (!OFFICIAL_THEME_IDS.has(theme.id) || theme.builtin !== true) {
            console.warn(`[Theme Engine Security]: Unauthorized tier declaration for theme "${theme.id}". Demoting category to "community".`);
            theme.category = 'community';
          }
        }

        validatedThemes.push(theme);
      } catch (fileErr) {
        console.warn(`[Theme Engine Warning]: Error reading theme file ${file}:`, fileErr.message);
      }
    }
  } catch (dirErr) {
    console.warn(`[Theme Engine Warning]: Unable to access themes directory at ${themesDir}:`, dirErr.message);
  }

  // Defensive Fallback: If no themes could be parsed or loaded, activate the built-in WhatsNexus base theme
  if (validatedThemes.length === 0) {
    console.warn('[Theme Engine Warning]: Theme scanner found 0 themes. Activating built-in fallback theme.');
    validatedThemes.push(FALLBACK_BASE_THEME);
  }

  cachedThemes = validatedThemes;
  return validatedThemes;
});

// Helper for sending IPC messages to mainWindow
function sendToRenderer(channel, ...args) {
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
    mainWindow.webContents.send(channel, ...args);
  }
}

// AutoUpdater Event Listeners
autoUpdater.on('update-available', (info) => {
  log.info('[AutoUpdater] update-available:', info);
  sendToRenderer('update-available', info);
});

autoUpdater.on('update-not-available', (info) => {
  log.info('[AutoUpdater] update-not-available:', info);
  sendToRenderer('update-not-available', info);
});

autoUpdater.on('download-progress', (progressObj) => {
  sendToRenderer('download-progress', progressObj);
});

autoUpdater.on('update-downloaded', (info) => {
  log.info('[AutoUpdater] update-downloaded:', info);
  sendToRenderer('update-downloaded', info);
});

autoUpdater.on('error', (err) => {
  log.error('[AutoUpdater] error:', err);
  sendToRenderer('update-error', err == null ? 'Error checking for updates' : (err.message || String(err)));
});

// Fallback checking GitHub Releases API directly
async function checkGitHubReleaseFallback() {
  return new Promise((resolve) => {
    try {
      const https = require('https');
      const semver = require('semver');
      const currentVersion = app.getVersion();

      const options = {
        hostname: 'api.github.com',
        path: '/repos/Sentinel-Mexico/WhatsNexus-Dekstop/releases/latest',
        method: 'GET',
        headers: {
          'User-Agent': `WhatsNexus/${currentVersion}`
        },
        timeout: 6000
      };

      const req = https.request(options, (res) => {
        if (res.statusCode !== 200) {
          log.info(`[AutoUpdater] GitHub release fallback returned HTTP ${res.statusCode}`);
          return resolve(null);
        }

        let raw = '';
        res.on('data', (chunk) => { raw += chunk; });
        res.on('end', () => {
          try {
            const data = JSON.parse(raw);
            const latestTag = (data.tag_name || '').replace(/^v/, '').trim();

            if (semver.valid(latestTag) && semver.gt(latestTag, currentVersion)) {
              const info = {
                version: data.tag_name,
                releaseName: data.name || data.tag_name,
                releaseNotes: data.body || '',
                html_url: data.html_url,
                assets: data.assets || []
              };
              log.info('[AutoUpdater] Newer release detected via GitHub API:', info.version);
              sendToRenderer('update-available', info);
              return resolve(info);
            } else {
              log.info('[AutoUpdater] App is up to date via GitHub release check.');
              sendToRenderer('update-not-available', { version: currentVersion });
              return resolve(null);
            }
          } catch (parseErr) {
            log.warn('[AutoUpdater] JSON parse error in GitHub release fallback:', parseErr.message);
            resolve(null);
          }
        });
      });

      req.on('error', (netErr) => {
        log.warn('[AutoUpdater] Network error in GitHub release fallback:', netErr.message);
        resolve(null);
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });

      req.end();
    } catch (err) {
      log.warn('[AutoUpdater] checkGitHubReleaseFallback unexpected error:', err);
      resolve(null);
    }
  });
}

async function handleCheckForUpdates(isSilent = false) {
  try {
    if (app.isPackaged) {
      return await autoUpdater.checkForUpdates();
    } else {
      return await checkGitHubReleaseFallback();
    }
  } catch (err) {
    log.warn('[AutoUpdater] Primary checkForUpdates failed, attempting GitHub API fallback:', err.message);
    try {
      const fallbackResult = await checkGitHubReleaseFallback();
      if (!fallbackResult && !isSilent) {
        sendToRenderer('update-error', err.message || 'Check for updates failed');
      }
      return fallbackResult;
    } catch (fallbackErr) {
      if (!isSilent) {
        sendToRenderer('update-error', fallbackErr.message || 'Check for updates failed');
      }
      return null;
    }
  }
}

// AutoUpdater IPC Handlers (Primary & Aliases)
ipcMain.handle('check-for-updates', () => handleCheckForUpdates(false));
ipcMain.handle('updater:check', () => handleCheckForUpdates(false));

ipcMain.handle('download-update', async () => {
  try {
    return await autoUpdater.downloadUpdate();
  } catch (err) {
    log.error('[AutoUpdater] Download update failed:', err);
    sendToRenderer('update-error', err.message || 'Download update failed');
    throw err;
  }
});
ipcMain.handle('updater:start-download', async () => {
  try {
    return await autoUpdater.downloadUpdate();
  } catch (err) {
    log.error('[AutoUpdater] Download update failed:', err);
    sendToRenderer('update-error', err.message || 'Download update failed');
    throw err;
  }
});

ipcMain.handle('install-update', () => {
  try {
    autoUpdater.quitAndInstall();
  } catch (err) {
    log.error('[AutoUpdater] Install update failed:', err);
    app.relaunch();
    app.exit(0);
  }
});
ipcMain.handle('updater:install-and-restart', () => {
  try {
    autoUpdater.quitAndInstall();
  } catch (err) {
    log.error('[AutoUpdater] Install update failed:', err);
    app.relaunch();
    app.exit(0);
  }
});

function checkMediaPermission(permission, details) {
  const isAudioDirect = permission === 'microphone' || permission === 'audio';
  const isVideoDirect = permission === 'camera' || permission === 'video';

  const singleType = details && details.mediaType;
  const multiTypes = (details && details.mediaTypes) || [];

  const wantsAudio = isAudioDirect || singleType === 'audio' || multiTypes.includes('audio');
  const wantsVideo = isVideoDirect || singleType === 'video' || multiTypes.includes('video');

  if (wantsAudio && wantsVideo) {
    return !!currentPermissions.camera && currentPermissions.microphone !== false;
  }
  if (wantsAudio) {
    return currentPermissions.microphone !== false;
  }
  if (wantsVideo) {
    return !!currentPermissions.camera;
  }

  return currentPermissions.microphone !== false || !!currentPermissions.camera;
}

function checkDisplayCapturePermission(details) {
  const singleType = details && details.mediaType;
  const multiTypes = (details && details.mediaTypes) || [];
  const wantsAudio = singleType === 'audio' || multiTypes.includes('audio');
  if (wantsAudio) {
    return currentPermissions.screenShare !== false && !!currentPermissions.screenShareAudio;
  }
  return currentPermissions.screenShare !== false;
}

function configureSessionPermissions(ses) {
  if (!ses) return;
  ses.setPermissionRequestHandler((webContents, permission, callback, details) => {
    if (permission === 'notifications') {
      return callback(currentPermissions.notifications !== false);
    }

    if (permission === 'clipboard-read' || permission === 'clipboard-sanitized-write') {
      return callback(true);
    }

    if (permission === 'media' || permission === 'microphone' || permission === 'camera' || permission === 'audio' || permission === 'video') {
      return callback(checkMediaPermission(permission, details));
    }

    if (permission === 'geolocation') {
      return callback(!!currentPermissions.location);
    }

    if (permission === 'display-capture') {
      return callback(checkDisplayCapturePermission(details));
    }

    callback(false); // Deny by default
  });

  ses.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    if (permission === 'notifications') {
      return currentPermissions.notifications !== false;
    }

    if (permission === 'clipboard-read' || permission === 'clipboard-sanitized-write') {
      return true;
    }

    if (permission === 'media' || permission === 'microphone' || permission === 'camera' || permission === 'audio' || permission === 'video') {
      return checkMediaPermission(permission, details);
    }

    if (permission === 'geolocation') {
      return !!currentPermissions.location;
    }

    if (permission === 'display-capture') {
      return checkDisplayCapturePermission(details);
    }

    return false; // Deny by default
  });
}

function configureSession(ses) {
  if (!ses || activeSessions.has(ses)) return;
  activeSessions.add(ses);
  configureSessionPermissions(ses);
  configureSessionDownloads(ses);
  applySpellChecker(ses, currentSystemSettings.spellcheckLanguages || ['es-ES']);
}

app.whenReady().then(() => {
  // Set macOS dock icon at runtime if available
  if (process.platform === 'darwin' && app.dock) {
    try {
      app.dock.setIcon(APP_ICON_PATH);
    } catch (e) {
      console.warn('Failed to set dock icon:', e.message);
    }
  }

  loadSavedPermissions();
  loadSavedSystemSettings();
  const savedAccs = loadSavedAccounts();
  configureSession(session.defaultSession);

  // Proactively configure sessions for all persisted account partitions
  if (Array.isArray(savedAccs)) {
    savedAccs.forEach(acc => {
      const partition = acc.partition || (acc.id && (acc.id.startsWith('persist:') ? acc.id : `persist:${acc.id}`));
      if (partition) {
        try {
          const ses = session.fromPartition(partition);
          configureSession(ses);
        } catch (_) {}
      }
    });
  }

  app.on('session-created', (ses) => {
    configureSession(ses);
  });

  createSplashWindow();
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.show();
    splashWindow.focus();
  }
  createWindow();
  createTray();

  // Strict 5000ms (5 seconds) timer: destroy splashWindow and simultaneously show mainWindow
  setTimeout(() => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.destroy();
      splashWindow = null;
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
    }

    // Silent background update check after UI is fully mounted and idle
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        log.info('[AutoUpdater] Initiating silent startup background update check...');
        handleCheckForUpdates(true).catch((err) => {
          log.info('[AutoUpdater] Silent background check caught exception:', err.message);
        });
      }
    }, 2000);
  }, 5000);
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      if (mainWindow) mainWindow.show();
    }
  });
});

app.on('before-quit', () => {
  app.isQuitting = true;
  if (tray) {
    tray.destroy();
    tray = null;
  }
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    // Keep app alive in system tray background unless explicitly quitting
    if (app.isQuitting) {
      app.quit();
    }
  }
});

