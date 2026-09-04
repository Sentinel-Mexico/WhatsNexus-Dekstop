const { app, BrowserWindow, Menu, Tray, ipcMain, nativeImage, nativeTheme, Notification, session, dialog, shell, webContents } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// 3. Flags de optimización de Chromium
app.commandLine.appendSwitch('disable-features', 'HardwareMediaKeyHandling,MediaSessionService,WaylandWpColorManagerV1');

// 1. Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Si el usuario intenta abrir otra instancia, enfocamos la original
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
        sandbox: false,
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
      sandbox: false,
      webviewTag: true, // CRITICAL: This allows the use of <webview> tags for session isolation
      backgroundThrottling: true, // Asegura throttling en background
      preload: path.join(__dirname, 'preload-main.js')
    }
  });

  // Load the index.html of the app
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Enviar ruta de descargas por defecto al renderer cuando termine de cargar
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
    console.warn('[Tray Warning]: No se pudo inicializar la bandeja del sistema (KDE/Wayland fallback):', err.message);
  }
}

// IPC para actualizar el contador de notificaciones / badge de la bandeja
ipcMain.on('update-tray-badge', (event, count) => {
  currentUnreadCount = Math.max(0, parseInt(count, 10) || 0);
  updateTrayImage();
});

// IPC para actualizar la apariencia de la bandeja (estilo de icono y visibilidad de contador)
ipcMain.on('update-tray-settings', (event, settings) => {
  if (settings) {
    if (settings.style !== undefined) currentTraySettings.style = settings.style;
    if (settings.showBadge !== undefined) currentTraySettings.showBadge = settings.showBadge;
    updateTrayImage();
  }
});

// IPC para sincronizar el modo de tema (dark/light) a nivel de sistema Chromium
ipcMain.on('set-theme-mode', (event, mode) => {
  if (mode === 'dark' || mode === 'light') {
    nativeTheme.themeSource = mode;
  }
});

// IPC para emitir notificaciones nativas con avatar circular respaldado en disco
ipcMain.on('show-native-notification', (event, data) => {
  if (!Notification.isSupported()) return;

  let iconPath = path.join(__dirname, 'assets', 'icon.png');

  // Si se envió un avatar circular en base64, guardarlo en caché en disco
  if (data.iconDataUrl && data.iconDataUrl.startsWith('data:image/png;base64,')) {
    try {
      const base64Data = data.iconDataUrl.replace(/^data:image\/png;base64,/, '');
      const tempAvatarPath = path.join(app.getPath('userData'), `avatar_notif_${Date.now() % 10}.png`);
      fs.writeFileSync(tempAvatarPath, base64Data, 'base64');
      iconPath = tempAvatarPath;
    } catch (e) {
      console.error('Error saving notification circular avatar:', e);
    }
  }

  const notification = new Notification({
    title: data.title || 'WhatsNexus',
    body: data.body || '',
    icon: iconPath,
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

// Configuración de Sistema (Descargas y Corrector Ortográfico)
let currentSystemSettings = {
  downloadPath: '',
  spellcheckLanguage: 'es'
};

function getSystemSettingsFilePath() {
  return path.join(app.getPath('userData'), 'system_settings.json');
}

function loadSavedSystemSettings() {
  try {
    const filePath = getSystemSettingsFilePath();
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      currentSystemSettings = { ...currentSystemSettings, ...data };
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

// Mapeo de códigos de interfaz (25 idiomas) a códigos BCP-47 para el corrector nativo de Chromium
const SPELLCHECK_MAP = {
  en: 'en-US',
  zh: 'zh-CN',
  hi: 'hi',
  es: 'es',
  fr: 'fr',
  ar: 'ar',
  bn: 'bn',
  pt: 'pt-BR',
  ru: 'ru',
  ur: 'ur',
  id: 'id',
  de: 'de',
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

const activeSessions = new Set();

function applySpellChecker(ses, langCode) {
  if (!ses) return;
  const targetCode = SPELLCHECK_MAP[langCode] || langCode || 'en-US';
  try {
    ses.setSpellCheckerLanguages([targetCode]);
  } catch (err) {
    console.error('[Spellchecker Error]:', err);
  }
}

function updateSpellCheckerAllSessions(langCode) {
  applySpellChecker(session.defaultSession, langCode);
  for (const ses of activeSessions) {
    applySpellChecker(ses, langCode);
  }
}

// Interceptar descargas en las sesiones para guardarlas en la ruta elegida por el usuario
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

ipcMain.on('open-external', (event, url) => {
  if (typeof url === 'string') {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        shell.openExternal(url);
      }
    } catch (_) {}
  }
});

ipcMain.handle('open-external-url', async (event, url) => {
  if (typeof url === 'string') {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        await shell.openExternal(url);
        return true;
      }
    } catch (_) {}
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
    spellcheckLanguage: currentSystemSettings.spellcheckLanguage || 'es'
  };
});

ipcMain.handle('set-spellchecker-language', (event, langCode) => {
  if (typeof langCode === 'string') {
    currentSystemSettings.spellcheckLanguage = langCode;
    saveSystemSettings();
    updateSpellCheckerAllSessions(langCode);
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

ipcMain.handle('load-locale', (event, langCode) => {
  if (!langCode || typeof langCode !== 'string') langCode = 'en';
  const cleanCode = langCode.trim();
  const safeLang = cleanCode.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();

  // Buscar coincidencia exacta o fallback a código base (ej: zh-CN -> zh)
  const baseCode = safeLang.split('-')[0].split('_')[0];
  const candidates = [
    `${safeLang}.json`,
    `${cleanCode}.json`,
    `${baseCode}.json`
  ];

  let resolvedPath = null;
  for (const filename of candidates) {
    const p = path.join(__dirname, 'locales', filename);
    if (fs.existsSync(p)) {
      resolvedPath = p;
      break;
    }
  }

  if (!resolvedPath) {
    console.error(`[Locale Load Error - Path]: Archivo no encontrado para código "${langCode}". Buscado en directorio: ${path.join(__dirname, 'locales')}`);
    return null;
  }

  try {
    const rawContent = fs.readFileSync(resolvedPath, 'utf8');
    try {
      return JSON.parse(rawContent);
    } catch (parseErr) {
      console.error(`[Locale Load Error - JSON Parse]: Error de parseo JSON en archivo ${resolvedPath}:`, parseErr);
      return null;
    }
  } catch (fsErr) {
    console.error(`[Locale Load Error - File Read]: Error de lectura en ruta ${resolvedPath}:`, fsErr);
    return null;
  }
});

function configureSessionPermissions(ses) {
  if (!ses) return;
  ses.setPermissionRequestHandler((webContents, permission, callback, details) => {
    if (permission === 'notifications') {
      return callback(false); // Bloquear notificaciones web nativas de Chromium
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
      return callback(true);
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

    callback(true);
  });

  ses.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    if (permission === 'notifications') {
      return false; // Bloquear comprobación de permisos nativos de Chromium
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
      return true;
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

    return true;
  });
}

function configureSession(ses) {
  if (!ses || activeSessions.has(ses)) return;
  activeSessions.add(ses);
  configureSessionPermissions(ses);
  configureSessionDownloads(ses);
  applySpellChecker(ses, currentSystemSettings.spellcheckLanguage || 'es');
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
    // Si no se está forzando salida, la app permanece viva en segundo plano en la bandeja
    if (app.isQuitting) {
      app.quit();
    }
  }
});

