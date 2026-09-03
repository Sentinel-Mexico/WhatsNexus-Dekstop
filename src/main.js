const { app, BrowserWindow, Menu, Tray, ipcMain, nativeImage } = require('electron');
const path = require('path');

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

app.whenReady().then(() => {
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

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    // Si no se está forzando salida, la app permanece viva en segundo plano en la bandeja
    if (app.isQuitting) {
      app.quit();
    }
  }
});

