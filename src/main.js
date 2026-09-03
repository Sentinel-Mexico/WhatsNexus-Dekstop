const { app, BrowserWindow, Menu, Tray, ipcMain, nativeImage, nativeTheme, Notification, session, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// 3. Flags de optimización de Chromium
app.commandLine.appendSwitch('disable-features', 'HardwareMediaKeyHandling,MediaSessionService,WaylandWpColorManagerV1');
app.commandLine.appendSwitch('disable-background-networking');

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
  splashWindow = new BrowserWindow({
    width: 480,
    height: 300,
    frame: false,
    resizable: false,
    transparent: true,
    alwaysOnTop: true,
    center: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'splash', 'splash-preload.js')
    }
  });

  splashWindow.loadFile(path.join(__dirname, 'splash', 'splash.html'));

  splashWindow.once('ready-to-show', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.show();
    }
  });

  splashWindow.on('closed', () => {
    splashWindow = null;
  });
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
      webviewTag: true, // CRITICAL: This allows the use of <webview> tags for session isolation
      backgroundThrottling: true, // Asegura throttling en background
      preload: path.join(__dirname, 'preload-main.js')
    }
  });

  // Load the index.html of the app
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Hide the menu bar for a cleaner look
  mainWindow.setMenuBarVisibility(false);

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
  const iconPath = getTrayIconPath(currentUnreadCount, currentTraySettings.style, currentTraySettings.showBadge);
  tray.setImage(iconPath);
  tray.setToolTip(currentUnreadCount > 0 ? `WhatsNexus (${currentUnreadCount} sin leer)` : 'WhatsNexus');
}

function createTray() {
  if (tray) return;

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

// Mapeo de códigos de interfaz (25 idiomas) a diccionarios locales Chromium .bdic
const SPELLCHECK_MAP = {
  en: 'en-US',
  zh: 'en-US',
  hi: 'hi',
  es: 'es-MX',
  fr: 'fr-FR',
  ar: 'en-US',
  bn: 'en-US',
  pt: 'pt-BR',
  ru: 'ru',
  ur: 'en-US',
  id: 'id',
  de: 'de-DE',
  ja: 'en-US',
  mr: 'en-US',
  te: 'en-US',
  tr: 'tr',
  ta: 'ta',
  yue: 'en-US',
  vi: 'vi',
  fil: 'en-US',
  ko: 'ko',
  fa: 'fa',
  ha: 'en-US',
  sw: 'en-US',
  it: 'it-IT'
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
  for (const ses of activeSessions) {
    applySpellChecker(ses, langCode);
  }
}

// Configuración de Privacidad y Red (Proxy y WebRTC)
let currentNetworkSettings = {
  useProxy: false,
  proxyType: 'direct', // 'direct', 'http', 'socks5', 'system'
  proxyHost: '',
  proxyPort: '',
  strictProxyIsolation: false,
  webrtcProtection: false
};

function getNetworkSettingsFilePath() {
  return path.join(app.getPath('userData'), 'network_settings.json');
}

function loadSavedNetworkSettings() {
  try {
    const filePath = getNetworkSettingsFilePath();
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      currentNetworkSettings = { ...currentNetworkSettings, ...data };
    }
  } catch (_) {}
}

function saveNetworkSettings() {
  try {
    const filePath = getNetworkSettingsFilePath();
    fs.writeFileSync(filePath, JSON.stringify(currentNetworkSettings, null, 2), 'utf8');
  } catch (_) {}
}

function getProxyConfig() {
  if (!currentNetworkSettings.useProxy || currentNetworkSettings.proxyType === 'direct') {
    return { mode: 'direct' };
  }
  if (currentNetworkSettings.proxyType === 'system') {
    return { mode: 'system' };
  }

  const host = (currentNetworkSettings.proxyHost || '').trim();
  const port = (currentNetworkSettings.proxyPort || '').trim();
  if (!host) {
    return { mode: 'direct' };
  }

  const endpoint = port ? `${host}:${port}` : host;
  const isSocks = currentNetworkSettings.proxyType === 'socks5';
  const proxyRules = isSocks ? `socks5://${endpoint}` : `http://${endpoint};https://${endpoint}`;
  const proxyBypassRules = currentNetworkSettings.strictProxyIsolation ? '' : '<local>';

  return {
    mode: 'fixed_servers',
    proxyRules,
    proxyBypassRules
  };
}

async function applyProxyToSession(ses) {
  if (!ses) return;
  try {
    const config = getProxyConfig();
    await ses.setProxy(config);
  } catch (err) {
    console.error('[Proxy Config Error]:', err);
  }
}

function applyWebRTCToSession(ses) {
  if (!ses) return;
  try {
    const policy = currentNetworkSettings.webrtcProtection ? 'disable-non-proxied-udp' : 'default';
    ses.setWebRTCIPHandlingPolicy(policy);
  } catch (err) {
    console.error('[WebRTC Policy Error]:', err);
  }
}

function updateNetworkAllSessions() {
  for (const ses of activeSessions) {
    applyProxyToSession(ses);
    applyWebRTCToSession(ses);
  }
}

// Interceptar descargas en las sesiones para guardarlas en la ruta elegida por el usuario
function configureSessionDownloads(ses) {
  if (!ses) return;
  ses.on('will-download', (event, item, webContents) => {
    let targetDir = currentSystemSettings.downloadPath;
    if (!targetDir) {
      try {
        targetDir = app.getPath('downloads');
      } catch (_) {}
    }
    if (targetDir) {
      try {
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
      } catch (_) {}
      const fileName = item.getFilename();
      const savePath = path.join(targetDir, fileName);
      item.setSavePath(savePath);
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

ipcMain.handle('select-download-directory', async () => {
  const defaultDir = currentSystemSettings.downloadPath || app.getPath('downloads');
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Seleccionar Carpeta de Descargas',
    defaultPath: defaultDir,
    properties: ['openDirectory', 'createDirectory']
  });

  if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
    const selected = result.filePaths[0];
    currentSystemSettings.downloadPath = selected;
    saveSystemSettings();
    return selected;
  }
  return currentSystemSettings.downloadPath || app.getPath('downloads');
});

ipcMain.handle('get-default-downloads-path', () => {
  return app.getPath('downloads');
});

ipcMain.handle('reset-download-directory', () => {
  const defaultDir = app.getPath('downloads');
  currentSystemSettings.downloadPath = defaultDir;
  saveSystemSettings();
  return defaultDir;
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

ipcMain.handle('get-network-settings', () => {
  return currentNetworkSettings;
});

ipcMain.handle('update-network-settings', (event, newSettings) => {
  if (newSettings && typeof newSettings === 'object') {
    currentNetworkSettings = { ...currentNetworkSettings, ...newSettings };
    saveNetworkSettings();
    updateNetworkAllSessions();
  }
  return currentNetworkSettings;
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
  applyProxyToSession(ses);
  applyWebRTCToSession(ses);
}

app.whenReady().then(() => {
  loadSavedPermissions();
  loadSavedSystemSettings();
  loadSavedNetworkSettings();
  configureSession(session.defaultSession);
  app.on('session-created', (ses) => {
    configureSession(ses);
  });

  createSplashWindow();
  createWindow();
  createTray();

  // Safety fallback: if splash hangs for more than 4s, reveal mainWindow
  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      mainWindow.show();
      mainWindow.focus();
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
      }
    }
  }, 4000);
  
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

