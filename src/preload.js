const { ipcRenderer } = require('electron');

let lastProfilePic = null;
let lastProfileName = null;
let observer = null;
let intervalId = null;
let attempts = 0;
const MAX_ATTEMPTS = 30; // Máximo ~5 minutos de reintentos lentos

let isDnd = false;
let notificationSettings = {
  desktopNotifications: true,
  contactPhoto: true,
  contactName: true,
  messagePreview: true,
  notificationSound: true
};

ipcRenderer.on('update-account-settings', (event, data) => {
  if (data && typeof data.dnd === 'boolean') {
    isDnd = data.dnd;
  }
});

const activePermissionStatuses = [];

let appPermissions = {
  microphone: true,
  camera: false,
  location: false,
  screenShare: true,
  screenShareAudio: false
};

function updatePreloadPermissions(perms) {
  if (!perms) return;
  const oldMic = appPermissions.microphone !== false;
  const oldCam = !!appPermissions.camera;
  const oldLoc = !!appPermissions.location;

  appPermissions = { ...appPermissions, ...perms };

  const newMic = appPermissions.microphone !== false;
  const newCam = !!appPermissions.camera;
  const newLoc = !!appPermissions.location;

  activePermissionStatuses.forEach(s => {
    try {
      let stateChanged = false;
      let newState = s.state;
      if (s.name === 'microphone' && oldMic !== newMic) {
        newState = newMic ? 'granted' : 'denied';
        stateChanged = true;
      } else if (s.name === 'camera' && oldCam !== newCam) {
        newState = newCam ? 'granted' : 'denied';
        stateChanged = true;
      } else if (s.name === 'geolocation' && oldLoc !== newLoc) {
        newState = newLoc ? 'granted' : 'denied';
        stateChanged = true;
      }

      if (stateChanged) {
        s.state = newState;
        s.status = newState;
        if (typeof s.onchange === 'function') {
          s.onchange(new Event('change'));
        }
        s.dispatchEvent(new Event('change'));
      }
    } catch (_) {}
  });
}

function updatePreloadNotifications(data) {
  if (!data) return;
  const oldDesktop = notificationSettings.desktopNotifications !== false;
  notificationSettings = { ...notificationSettings, ...data };
  const newDesktop = notificationSettings.desktopNotifications !== false;

  if (oldDesktop !== newDesktop) {
    const state = newDesktop ? 'granted' : 'denied';
    activePermissionStatuses.forEach(s => {
      if (s.name === 'notifications') {
        try {
          s.state = state;
          s.status = state;
          if (typeof s.onchange === 'function') {
            s.onchange(new Event('change'));
          }
          s.dispatchEvent(new Event('change'));
        } catch (_) {}
      }
    });
  }
}

ipcRenderer.on('update-notification-settings', (event, data) => {
  updatePreloadNotifications(data);
});

ipcRenderer.on('notifications:updated', (event, data) => {
  updatePreloadNotifications(data);
});

ipcRenderer.on('update-permission-settings', (event, data) => {
  updatePreloadPermissions(data);
});

ipcRenderer.on('permissions:updated', (event, data) => {
  updatePreloadPermissions(data);
});

// Silenciar ÚNICAMENTE la alerta de notificación cuando DND está activo o el sonido de notificación
// está desactivado, preservando siempre la reproducción de audios y videos de los chats.
const origAudioPlay = HTMLAudioElement.prototype.play;
HTMLAudioElement.prototype.play = function() {
  const shouldMuteAlert = isDnd || (notificationSettings && notificationSettings.notificationSound === false);
  if (shouldMuteAlert) {
    const isUserGesture = (navigator.userActivation && navigator.userActivation.isActive) ||
      (window.event && (window.event.type === 'click' || window.event.type === 'pointerdown' || window.event.type === 'pointerup'));
    
    const isMedia = isUserGesture || (this.duration && this.duration > 2.5);
    if (!isMedia) {
      this.muted = true;
      this.volume = 0;
      return Promise.resolve();
    }
  }
  return origAudioPlay.apply(this, arguments);
};

// ========================================================
// 1. Procesamiento de Notificaciones y Recorte Circular
// ========================================================
function makeCircularAvatar(src, callback) {
  if (!src) return callback(null);
  try {
    const img = new Image();
    // NUNCA asignar crossOrigin en blob: o data: URLs
    if (src.startsWith('http://') || src.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      try {
        const size = Math.min(img.width, img.height) || 128;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, 0, 0, size, size);
        callback(canvas.toDataURL('image/png'));
      } catch (err) {
        callback(null);
      }
    };
    img.onerror = () => callback(null);
    img.src = src;
  } catch (err) {
    callback(null);
  }
}

function dispatchNotificationToHost(title, options = {}) {
  if (isDnd || notificationSettings.desktopNotifications === false) {
    return;
  }
  const rawIcon = options.icon;
  if (rawIcon) {
    makeCircularAvatar(rawIcon, (circularIcon) => {
      ipcRenderer.sendToHost('guest-notification', {
        title: title || 'WhatsApp',
        body: options.body || '',
        iconDataUrl: circularIcon
      });
    });
  } else {
    ipcRenderer.sendToHost('guest-notification', {
      title: title || 'WhatsApp',
      body: options.body || '',
      iconDataUrl: null
    });
  }
}

// ========================================================
// Notification API Mocking & Session Interception
// ========================================================
function CustomNotification(title, options = {}) {
  const self = (this instanceof CustomNotification) ? this : Object.create(CustomNotification.prototype);
  self.title = title || 'WhatsApp';
  self.body = options.body || '';
  self.icon = options.icon || '';
  self.tag = options.tag || '';
  self.data = options.data || null;
  self.timestamp = Date.now();
  self.onclick = null;
  self.onclose = null;
  self.onerror = null;
  self.onshow = null;

  if (!isDnd && notificationSettings && notificationSettings.desktopNotifications !== false) {
    dispatchNotificationToHost(title, options);
  }

  return self;
}

CustomNotification.prototype = Object.create(EventTarget.prototype);
CustomNotification.prototype.constructor = CustomNotification;
CustomNotification.prototype.close = function() {};
CustomNotification.maxActions = 2;

Object.defineProperty(CustomNotification, 'permission', {
  get: () => {
    if (notificationSettings && notificationSettings.desktopNotifications === false) {
      return 'denied';
    }
    return 'granted';
  },
  configurable: true
});

Object.defineProperty(CustomNotification.prototype, 'permission', {
  get: () => {
    if (notificationSettings && notificationSettings.desktopNotifications === false) {
      return 'denied';
    }
    return 'granted';
  },
  configurable: true
});

CustomNotification.requestPermission = function(cb) {
  const perm = (notificationSettings && notificationSettings.desktopNotifications === false) ? 'denied' : 'granted';
  const p = Promise.resolve(perm);
  if (typeof cb === 'function') {
    try {
      cb(perm);
    } catch (_) {}
  }
  return p;
};

// Sobrescribir window.Notification de manera inmediata y definitiva
try {
  window.Notification = CustomNotification;
  Object.defineProperty(window, 'Notification', {
    value: CustomNotification,
    writable: true,
    configurable: true
  });
} catch (e) {
  console.error('Error defining window.Notification:', e);
}

// Mock navigator.permissions.query for notifications, microphone, camera, and geolocation
if (navigator.permissions && typeof navigator.permissions.query === 'function') {
  const origQuery = navigator.permissions.query.bind(navigator.permissions);
  navigator.permissions.query = function(params) {
    if (params && params.name) {
      const name = params.name;
      if (name === 'notifications' || name === 'microphone' || name === 'camera' || name === 'geolocation') {
        let isGranted = false;
        if (name === 'notifications') {
          isGranted = notificationSettings && notificationSettings.desktopNotifications !== false;
        } else if (name === 'microphone') {
          isGranted = appPermissions && appPermissions.microphone !== false;
        } else if (name === 'camera') {
          isGranted = appPermissions && !!appPermissions.camera;
        } else if (name === 'geolocation') {
          isGranted = appPermissions && !!appPermissions.location;
        }

        const state = isGranted ? 'granted' : 'denied';
        const eventTarget = new EventTarget();
        const statusObj = {
          name: name,
          state: state,
          status: state,
          onchange: null,
          addEventListener: eventTarget.addEventListener.bind(eventTarget),
          removeEventListener: eventTarget.removeEventListener.bind(eventTarget),
          dispatchEvent: eventTarget.dispatchEvent.bind(eventTarget)
        };
        activePermissionStatuses.push(statusObj);
        return Promise.resolve(statusObj);
      }
    }
    return origQuery(params);
  };
}

// Ensure navigator.mediaDevices.getUserMedia adheres reactively to app permissions
if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
  const origGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia = function(constraints) {
    if (constraints) {
      if (constraints.audio && appPermissions && appPermissions.microphone === false) {
        return Promise.reject(new DOMException('Permission denied', 'NotAllowedError'));
      }
      if (constraints.video && appPermissions && !appPermissions.camera) {
        return Promise.reject(new DOMException('Permission denied', 'NotAllowedError'));
      }
    }
    return origGetUserMedia(constraints);
  };
}

if (navigator.getUserMedia) {
  const origLegacyGUM = navigator.getUserMedia.bind(navigator);
  navigator.getUserMedia = function(constraints, success, error) {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia(constraints).then(success).catch(error);
    } else {
      origLegacyGUM(constraints, success, error);
    }
  };
}

// Deshabilitar Service Workers para forzar el canal Notification
if (navigator.serviceWorker) {
  try {
    navigator.serviceWorker.register = function() {
      return Promise.reject(new Error('SW notifications disabled'));
    };
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (const reg of registrations) {
        reg.unregister();
      }
    }).catch(() => {});
  } catch (_) {}
}

// Interceptar también ServiceWorkerRegistration si llegara a existir
if (window.ServiceWorkerRegistration && window.ServiceWorkerRegistration.prototype.showNotification) {
  window.ServiceWorkerRegistration.prototype.showNotification = function(title, options) {
    if (isDnd || (notificationSettings && notificationSettings.desktopNotifications === false)) {
      return Promise.resolve();
    }
    dispatchNotificationToHost(title, options);
    return Promise.resolve();
  };
}

// ========================================================
// 2. Extracción de Foto y Nombre de Perfil (Filtrando Meta AI)
// ========================================================
function isMetaAiElement(el) {
  if (!el) return false;
  const alt = (el.alt || '').toLowerCase();
  const title = (el.title || '').toLowerCase();
  const src = (el.src || '').toLowerCase();
  const aria = (el.getAttribute('aria-label') || '').toLowerCase();
  const testId = (el.getAttribute('data-testid') || '').toLowerCase();

  if (alt.includes('meta ai') || title.includes('meta ai') || aria.includes('meta ai') || testId.includes('meta-ai') || src.includes('meta_ai')) {
    return true;
  }

  const parentWithMeta = el.closest('[aria-label*="Meta AI" i], [aria-label*="meta ai" i], [data-testid*="meta-ai" i], [title*="Meta AI" i]');
  return !!parentWithMeta;
}

function extractProfilePicture() {
  try {
    const profileSelectors = [
      'button[aria-label*="Profile" i] img',
      'button[aria-label*="Perfil" i] img',
      '[data-testid="chatlist-header"] button img',
      'header button img',
      'header div[role="button"] img',
      'header img[src*="pps.whatsapp.net"]',
      'header img'
    ];

    for (const selector of profileSelectors) {
      const candidates = document.querySelectorAll(selector);
      for (const img of candidates) {
        if (img && img.src && !isMetaAiElement(img)) {
          if (img.src !== lastProfilePic) {
            lastProfilePic = img.src;
            ipcRenderer.sendToHost('profile-picture-updated', img.src);
          }
          return true;
        }
      }
    }
  } catch (error) {
    console.error('Error extrayendo foto de perfil:', error);
  }
  return false;
}

function extractProfileName() {
  try {
    const pushname = window.localStorage.getItem('pushname');
    if (pushname && pushname.trim() && !pushname.toLowerCase().includes('meta ai')) {
      return pushname.trim();
    }

    const profileBtns = document.querySelectorAll('button[aria-label*="Profile" i], button[aria-label*="Perfil" i], header div[role="button"]');
    for (const btn of profileBtns) {
      const label = btn.getAttribute('aria-label') || btn.getAttribute('title') || '';
      const match = label.match(/(?:profile|perfil)(?:\s*(?:de|:|-)\s*)(.+)/i);
      if (match && match[1] && !match[1].toLowerCase().includes('meta ai')) {
        return match[1].trim();
      }
    }

    const drawerInput = document.querySelector('[data-testid="profile-name-input"] input, [data-testid="drawer-left"] span[title]');
    if (drawerInput) {
      const val = drawerInput.value || drawerInput.innerText || drawerInput.getAttribute('title');
      if (val && val.trim() && !val.toLowerCase().includes('meta ai')) {
        return val.trim();
      }
    }

    const lastWid = window.localStorage.getItem('last-wid-md');
    if (lastWid) {
      const numMatch = lastWid.match(/^(\d+)@/);
      if (numMatch && numMatch[1]) {
        return `+${numMatch[1]}`;
      }
    }
  } catch (e) {
    console.error('Error extrayendo nombre de perfil:', e);
  }
  return null;
}

function checkProfileInfo() {
  const picFound = extractProfilePicture();
  
  const name = extractProfileName();
  if (name && name !== lastProfileName) {
    lastProfileName = name;
    ipcRenderer.sendToHost('profile-name-updated', name);
  }

  if (picFound && lastProfileName) {
    cleanupObservers();
  }
}

function cleanupObservers() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

let isTabActive = true;
ipcRenderer.on('set-tab-active', (event, active) => {
  isTabActive = !!active;
});

window.addEventListener('load', () => {
  checkProfileInfo();

  let debounceTimer = null;
  observer = new MutationObserver(() => {
    // If tab is inactive in background, suppress DOM profile parsing to save CPU
    if (!isTabActive) return;

    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    if (debounceTimer) return;
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      checkProfileInfo();
    }, 2500);
  });

  // Observe specific container rather than unbounded body mutations
  const targetNode = document.querySelector('#app') || document.querySelector('#side') || document.body;
  if (targetNode) {
    observer.observe(targetNode, { childList: true, subtree: true });
  }

  // Hard cap observer lifespan to 60 seconds to release memory and DOM hooks
  setTimeout(() => {
    cleanupObservers();
  }, 60000);

  intervalId = setInterval(() => {
    if (isTabActive) {
      attempts++;
      checkProfileInfo();
    }
    if (attempts >= MAX_ATTEMPTS) {
      cleanupObservers();
    }
  }, 10000);
});

// ========================================================
// 3. Sincronización de Tema (Claro / Oscuro) en WhatsApp Web
// ========================================================
let isDarkMode = true;

function applyThemeToGuest(dark) {
  isDarkMode = dark;
  const root = document.documentElement;
  const body = document.body;

  if (root) {
    if (dark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }

  if (body) {
    if (dark) {
      body.classList.add('dark');
      body.classList.remove('light');
    } else {
      body.classList.remove('dark');
      body.classList.add('light');
    }
  }
}

ipcRenderer.on('set-dark-mode', (event, dark) => {
  applyThemeToGuest(dark);
});

const originalMatchMedia = window.matchMedia;
window.matchMedia = function(query) {
  if (typeof query === 'string' && query.includes('prefers-color-scheme')) {
    const matches = query.includes('dark') ? isDarkMode : !isDarkMode;
    return {
      matches,
      media: query,
      onchange: null,
      addListener: function() {},
      removeListener: function() {},
      addEventListener: function() {},
      removeEventListener: function() {},
      dispatchEvent: function() { return false; }
    };
  }
  return originalMatchMedia ? originalMatchMedia.call(window, query) : { matches: false };
};

window.addEventListener('DOMContentLoaded', () => {
  applyThemeToGuest(isDarkMode);
});

// ==========================================================================
// External Link Interceptor (Open in Default System Browser)
// ==========================================================================
function handleExternalLinkClick(event) {
  const anchor = event.target && event.target.closest ? event.target.closest('a') : null;
  if (!anchor) return;

  const rawHref = anchor.getAttribute('href') || anchor.href;
  if (!rawHref || typeof rawHref !== 'string') return;

  // Ignore javascript:, in-page hash links, or empty refs
  if (rawHref.startsWith('javascript:') || rawHref.startsWith('#')) return;

  try {
    const parsed = new URL(anchor.href);
    const isWhatsappHost = parsed.hostname === 'web.whatsapp.com';
    const isBlobOrData = parsed.protocol === 'blob:' || parsed.protocol === 'data:';

    // WhatsApp renders external message links as target="_blank"
    // Any link pointing outside web.whatsapp.com or having target="_blank" must open externally
    if ((!isWhatsappHost && !isBlobOrData) || anchor.target === '_blank') {
      event.preventDefault();
      event.stopPropagation();
      ipcRenderer.send('open-external', anchor.href);
    }
  } catch (_) {
    // If URL parsing fails but starts with valid web schemes
    if (rawHref.startsWith('http://') || rawHref.startsWith('https://') || rawHref.startsWith('mailto:')) {
      event.preventDefault();
      event.stopPropagation();
      ipcRenderer.send('open-external', rawHref);
    }
  }
}

// Attach in capture phase so it triggers before WhatsApp's synthetic React events
document.addEventListener('click', handleExternalLinkClick, true);
document.addEventListener('auxclick', (event) => {
  // Middle click (wheel click)
  if (event.button === 1) {
    handleExternalLinkClick(event);
  }
}, true);

// Intercept window.open calls from guest page
try {
  const originalWindowOpen = window.open;
  window.open = function(url, target, features) {
    if (typeof url === 'string' && url && !url.startsWith('about:blank') && !url.startsWith('javascript:')) {
      ipcRenderer.send('open-external', url);
      return null;
    }
    return originalWindowOpen ? originalWindowOpen.call(window, url, target, features) : null;
  };
} catch (_) {}

