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

ipcRenderer.on('update-notification-settings', (event, data) => {
  if (data) {
    notificationSettings = { ...notificationSettings, ...data };
  }
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

function CustomNotification(title, options = {}) {
  if (isDnd || notificationSettings.desktopNotifications === false) {
    return {
      onclick: null,
      onclose: null,
      onerror: null,
      onshow: null,
      addEventListener: function() {},
      removeEventListener: function() {},
      close: function() {}
    };
  }
  dispatchNotificationToHost(title, options);
  return {
    onclick: null,
    onclose: null,
    onerror: null,
    onshow: null,
    addEventListener: function() {},
    removeEventListener: function() {},
    close: function() {}
  };
}

Object.defineProperty(CustomNotification, 'permission', {
  get: () => 'granted',
  configurable: true
});

CustomNotification.requestPermission = function(cb) {
  const p = Promise.resolve('granted');
  if (typeof cb === 'function') p.then(cb);
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
  console.error('Error definying window.Notification:', e);
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
    if (isDnd || notificationSettings.desktopNotifications === false) {
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

window.addEventListener('load', () => {
  checkProfileInfo();

  let debounceTimer = null;
  observer = new MutationObserver(() => {
    // Stop the fallback polling interval immediately as MutationObserver has taken over
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    if (debounceTimer) return;
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      checkProfileInfo();
    }, 1500);
  });

  observer.observe(document.body, { childList: true, subtree: true });

  intervalId = setInterval(() => {
    attempts++;
    checkProfileInfo();
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
