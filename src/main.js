const { app, BrowserWindow, Menu, Tray, ipcMain } = require('electron');
const path = require('path');

// 3. Flags de optimización de Chromium
app.commandLine.appendSwitch('disable-features', 'HardwareMediaKeyHandling,MediaSessionService');
app.commandLine.appendSwitch('disable-site-isolation-trials'); // Reduce overhead de memoria
app.commandLine.appendSwitch('disable-background-networking');
app.commandLine.appendSwitch('disable-ipc-flooding-protection');
app.commandLine.appendSwitch('enable-low-end-device-mode'); // Fuerte reducción de VRAM/RAM
app.commandLine.appendSwitch('renderer-process-limit', '2'); // Limitamos agresivamente
app.commandLine.appendSwitch('js-flags', '--optimize_for_size --max-old-space-size=128'); // Heap V8 compacto
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache'); // Reduce I/O en disco

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

function createTray() {
  // Use a placeholder or a simple system icon for the tray
  // In a real app, use a proper .ico (Windows) or .png (macOS/Linux)
  // tray = new Tray(path.join(__dirname, 'assets', 'tray.png'));
  
  // For the sake of the scaffold without assets, we won't instantiate tray immediately
  // unless an icon exists, but here is the logic:
  /*
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Mostrar App', click: function () { mainWindow.show(); } },
    { label: 'Salir', click: function () { app.isQuitting = true; app.quit(); } }
  ]);
  tray.setToolTip('WhatsNexus');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    mainWindow.show();
  });
  */
}

app.whenReady().then(() => {
  createSplashWindow();
  createWindow();

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
  if (process.platform !== 'darwin') app.quit();
});

