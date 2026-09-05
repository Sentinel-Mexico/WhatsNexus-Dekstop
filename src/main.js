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
      show: false,
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
      }
    });

    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed() && !splashWindow.isVisible()) {
        splashWindow.show();
      }
    }, 250);

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
    icon: path.join(__dirname, 'assets', 'icon.png'), // Placeholder icon path
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

// Handle transition from splash screen to main window
ipcMain.on('splash-finished', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
  }
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close();
  }
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

  return path.join(__dirname, 'assets', filename);
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

  let icon = path.join(__dirname, 'assets', 'icon.png');

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
    }
  } catch (_) {}
}

function savePermissions() {
  try {
    const filePath = getPermissionsFilePath();
    fs.writeFileSync(filePath, JSON.stringify(currentPermissions, null, 2), 'utf8');
  } catch (_) {}
}

ipcMain.on('update-permission-settings', (event, permissions) => {
  if (permissions) {
    currentPermissions = { ...currentPermissions, ...permissions };
    savePermissions();
  }
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

// AutoUpdater IPC Handlers
ipcMain.handle('check-for-updates', async () => {
  try {
    return await autoUpdater.checkForUpdates();
  } catch (err) {
    log.error('[AutoUpdater] Check for updates failed:', err);
    sendToRenderer('update-error', err.message || 'Check for updates failed');
    throw err;
  }
});

ipcMain.handle('download-update', async () => {
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
  }
});

function configureSessionPermissions(ses) {
  if (!ses) return;
  ses.setPermissionRequestHandler((webContents, permission, callback, details) => {
    if (permission === 'notifications') {
      return callback(false); // Block Chromium native web notifications
    }

    if (permission === 'media') {
      const mediaTypes = (details && details.mediaTypes) || [];
      const wantsAudio = mediaTypes.includes('audio');
      const wantsVideo = mediaTypes.includes('video');

      if (wantsAudio && wantsVideo) {
        return callback(!!currentPermissions.camera && !!currentPermissions.microphone);
      } else if (wantsAudio) {
        return callback(!!currentPermissions.microphone);
      } else if (wantsVideo) {
        return callback(!!currentPermissions.camera);
      }
      return callback(false);
    }

    if (permission === 'geolocation') {
      return callback(!!currentPermissions.location);
    }

    if (permission === 'display-capture') {
      const mediaTypes = (details && details.mediaTypes) || [];
      const wantsAudio = mediaTypes.includes('audio');
      if (wantsAudio) {
        return callback(!!currentPermissions.screenShare && !!currentPermissions.screenShareAudio);
      }
      return callback(!!currentPermissions.screenShare);
    }

    callback(false); // Deny by default
  });

  ses.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    if (permission === 'notifications') {
      return false; // Block Chromium native permission check
    }

    if (permission === 'media') {
      const mediaTypes = (details && details.mediaTypes) || [];
      const wantsAudio = mediaTypes.includes('audio');
      const wantsVideo = mediaTypes.includes('video');

      if (wantsAudio && wantsVideo) {
        return !!currentPermissions.camera && !!currentPermissions.microphone;
      } else if (wantsAudio) {
        return !!currentPermissions.microphone;
      } else if (wantsVideo) {
        return !!currentPermissions.camera;
      }
      return false;
    }

    if (permission === 'geolocation') {
      return !!currentPermissions.location;
    }

    if (permission === 'display-capture') {
      const mediaTypes = (details && details.mediaTypes) || [];
      const wantsAudio = mediaTypes.includes('audio');
      if (wantsAudio) {
        return !!currentPermissions.screenShare && !!currentPermissions.screenShareAudio;
      }
      return !!currentPermissions.screenShare;
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
  loadSavedPermissions();
  loadSavedSystemSettings();
  configureSession(session.defaultSession);
  app.on('session-created', (ses) => {
    configureSession(ses);
  });

  createSplashWindow();
  createWindow();
  createTray();

  // Safety fallback: if splash hangs for more than 2.5s, reveal mainWindow
  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      mainWindow.show();
      mainWindow.focus();
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
      }
    }
  }, 2500);
  
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

