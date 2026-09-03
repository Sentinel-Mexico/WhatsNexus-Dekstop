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

function generateTrayIcon(unreadCount = 0, style = 'auto', showBadge = true) {
  let baseColor = '#00a884'; // Default emerald brand
  if (style === 'light') baseColor = '#FFFFFF';
  else if (style === 'dark') baseColor = '#111B21';

  const badgeSvg = (showBadge && unreadCount > 0)
    ? `<circle cx="24" cy="8" r="6.5" fill="#EF5350" stroke="#FFFFFF" stroke-width="1.5"/>
       <text x="24" y="10.2" font-size="7" font-weight="bold" fill="#FFFFFF" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">${unreadCount > 99 ? '99+' : unreadCount}</text>`
    : '';

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <path fill="${baseColor}" d="M16 2C8.27 2 2 8.27 2 16c0 2.77.8 5.34 2.18 7.52L2.09 29.91a1 1 0 0 0 1.26 1.26l6.39-2.09A13.92 13.92 0 0 0 16 30c7.73 0 14-6.27 14-14S23.73 2 16 2zm0 25.5a11.43 11.43 0 0 1-5.84-1.6l-.42-.25-4.33 1.42 1.42-4.33-.25-.42A11.44 11.44 0 0 1 4.5 16C4.5 9.65 9.65 4.5 16 4.5S27.5 9.65 27.5 16 22.35 27.5 16 27.5z"/>
    <path fill="${baseColor}" d="M20.5 18.5c-.3-.15-1.7-.84-1.96-.94-.26-.1-.45-.15-.64.15-.19.3-.74.94-.91 1.13-.17.19-.34.21-.64.06-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.78-1.68-2.08-.18-.3-.02-.46.13-.61.13-.13.3-.34.45-.51.15-.17.2-.29.3-.48.1-.19.05-.36-.02-.51-.08-.15-.64-1.55-.88-2.12-.23-.55-.47-.48-.64-.49h-.55c-.19 0-.5.07-.76.36-.26.29-1 1-1 2.43s1.02 2.82 1.16 3.01c.14.19 2.01 3.07 4.87 4.31.68.29 1.21.47 1.63.6.69.22 1.31.19 1.8.12.55-.08 1.7-.69 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.12-.26-.19-.56-.34z"/>
    ${badgeSvg}
  </svg>`.trim();

  const dataUrl = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
  return nativeImage.createFromDataURL(dataUrl);
}

function updateTrayImage() {
  if (!tray) return;
  const icon = generateTrayIcon(currentUnreadCount, currentTraySettings.style, currentTraySettings.showBadge);
  tray.setImage(icon);
  tray.setToolTip(currentUnreadCount > 0 ? `WhatsNexus (${currentUnreadCount} sin leer)` : 'WhatsNexus');
}

function createTray() {
  if (tray) return;

  const icon = generateTrayIcon(currentUnreadCount, currentTraySettings.style, currentTraySettings.showBadge);
  tray = new Tray(icon);
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

