const { app, BrowserWindow, Menu, Tray, ipcMain, nativeImage, nativeTheme, Notification, session } = require('electron');
const path = require('path');
const fs = require('fs');

// 3. Flags de optimización de Chromium
app.commandLine.appendSwitch('disable-features', 'HardwareMediaKeyHandling,MediaSessionService,WaylandWpColorManagerV1');
app.commandLine.appendSwitch('disable-site-isolation-trials'); // Reduce overhead de memoria entre orígenes
app.commandLine.appendSwitch('disable-background-networking');
app.commandLine.appendSwitch('disable-ipc-flooding-protection');

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
      nodeIntegration: true,
      contextIsolation: false
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
      nodeIntegration: true,
      contextIsolation: false, // For simplicity in this scaffolding, though contextBridge is recommended for prod
      webviewTag: true, // CRITICAL: This allows the use of <webview> tags for session isolation
      backgroundThrottling: true // Asegura throttling en background
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

ipcMain.on('update-permission-settings', (event, permissions) => {
  if (permissions) {
    currentPermissions = { ...currentPermissions, ...permissions };
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
      return !!currentPermissions.screenShare;
    }

    return true;
  });
}

app.whenReady().then(() => {
  configureSessionPermissions(session.defaultSession);
  app.on('session-created', (ses) => {
    configureSessionPermissions(ses);
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

