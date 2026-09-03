const { ipcRenderer } = require('electron');

let lastProfilePic = null;
let lastProfileName = null;
let observer = null;
let intervalId = null;
let attempts = 0;
const MAX_ATTEMPTS = 30; // Máximo ~5 minutos de reintentos lentos

// ========================================================
// 1. Extracción de Foto y Nombre de Perfil (Filtrando Meta AI)
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
    // 1. Intentar desde pushname en localStorage de WhatsApp Web
    const pushname = window.localStorage.getItem('pushname');
    if (pushname && pushname.trim() && !pushname.toLowerCase().includes('meta ai')) {
      return pushname.trim();
    }

    // 2. Intentar desde aria-label o título del botón de perfil en el header
    const profileBtns = document.querySelectorAll('button[aria-label*="Profile" i], button[aria-label*="Perfil" i], header div[role="button"]');
    for (const btn of profileBtns) {
      const label = btn.getAttribute('aria-label') || btn.getAttribute('title') || '';
      const match = label.match(/(?:profile|perfil)(?:\s*(?:de|:|-)\s*)(.+)/i);
      if (match && match[1] && !match[1].toLowerCase().includes('meta ai')) {
        return match[1].trim();
      }
    }

    // 3. Intentar desde el drawer o panel de perfil si está abierto/cargado en DOM
    const drawerInput = document.querySelector('[data-testid="profile-name-input"] input, [data-testid="drawer-left"] span[title]');
    if (drawerInput) {
      const val = drawerInput.value || drawerInput.innerText || drawerInput.getAttribute('title');
      if (val && val.trim() && !val.toLowerCase().includes('meta ai')) {
        return val.trim();
      }
    }

    // 4. Fallback al número de teléfono desde last-wid-md
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
// 2. Sincronización de Tema (Claro / Oscuro) en WhatsApp Web
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

// Engañar a WhatsApp Web haciendo que window.matchMedia retorne el tema del usuario
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

// ========================================================
// 3. Control de Notificaciones, DND y Avatares Circulares
// ========================================================
let notificationSettings = {
  desktopNotifications: true,
  contactPhoto: true,
  contactName: true,
  messagePreview: true,
  notificationSound: true
};
let isDnd = false;

ipcRenderer.on('update-notification-settings', (event, newSettings) => {
  if (newSettings) {
    notificationSettings = { ...notificationSettings, ...newSettings };
  }
});

ipcRenderer.on('update-account-settings', (event, data) => {
  if (data && data.dnd !== undefined) {
    isDnd = !!data.dnd;
  }
});

// Silenciar audio si la cuenta está en DND o el sonido de notificación está desactivado
const origAudioPlay = HTMLAudioElement.prototype.play;
HTMLAudioElement.prototype.play = function() {
  if (isDnd || !notificationSettings.notificationSound) {
    return Promise.resolve();
  }
  return origAudioPlay.apply(this, arguments);
};

function makeCircularAvatar(src, callback) {
  if (!src) return callback(src);
  try {
    const img = new Image();
    // CRÍTICO: NUNCA asignar crossOrigin en blob: o data: URLs (provoca fallo de CORS y canvas tainted)
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
        canvas.toBlob((blob) => {
          if (blob) {
            callback(URL.createObjectURL(blob));
          } else {
            callback(canvas.toDataURL('image/png'));
          }
        }, 'image/png');
      } catch (_) {
        callback(src);
      }
    };
    img.onerror = () => callback(src);
    img.src = src;
  } catch (_) {
    callback(src);
  }
}

function processNotificationOptions(title, options = {}) {
  let finalTitle = title;
  const finalOptions = { ...options };

  // 1. Nombre de contacto
  if (!notificationSettings.contactName) {
    finalTitle = 'WhatsNexus';
  }

  // 2. Foto de contacto
  if (!notificationSettings.contactPhoto) {
    delete finalOptions.icon;
  }

  // 3. Vista previa del mensaje
  if (!notificationSettings.messagePreview) {
    finalOptions.body = '•••';
  }

  // 4. Sonido de alerta
  if (!notificationSettings.notificationSound) {
    finalOptions.silent = true;
  }

  return { finalTitle, finalOptions };
}

// 1. Interceptar window.Notification
const OriginalNotification = window.Notification;

if (OriginalNotification) {
  function CustomNotification(title, options = {}) {
    // Si la cuenta está en No Molestar o las notificaciones de escritorio están apagadas
    if (isDnd || !notificationSettings.desktopNotifications) {
      return {
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
        close: () => {}
      };
    }

    const { finalTitle, finalOptions } = processNotificationOptions(title, options);

    const proxy = {
      onclick: null,
      onclose: null,
      onerror: null,
      onshow: null,
      instance: null,
      addEventListener: function(type, listener) {
        if (this.instance) this.instance.addEventListener(type, listener);
      },
      removeEventListener: function(type, listener) {
        if (this.instance) this.instance.removeEventListener(type, listener);
      },
      close: function() {
        if (this.instance) this.instance.close();
      }
    };

    const emitNotification = (opts) => {
      try {
        const notif = new OriginalNotification(finalTitle, opts);
        proxy.instance = notif;
        ['click', 'close', 'error', 'show'].forEach(evt => {
          notif.addEventListener(evt, (e) => {
            if (typeof proxy['on' + evt] === 'function') proxy['on' + evt](e);
          });
        });
      } catch (err) {
        console.error('Error dispatching native notification:', err);
      }
    };

    if (finalOptions.icon) {
      makeCircularAvatar(finalOptions.icon, (circularIcon) => {
        finalOptions.icon = circularIcon;
        emitNotification(finalOptions);
      });
    } else {
      emitNotification(finalOptions);
    }

    return proxy;
  }

  CustomNotification.permission = OriginalNotification.permission;
  CustomNotification.requestPermission = OriginalNotification.requestPermission.bind(OriginalNotification);

  window.Notification = CustomNotification;
}

// 2. Interceptar ServiceWorkerRegistration.prototype.showNotification (empleado por WhatsApp Web)
if (window.ServiceWorkerRegistration && window.ServiceWorkerRegistration.prototype.showNotification) {
  const origShowNotification = ServiceWorkerRegistration.prototype.showNotification;
  ServiceWorkerRegistration.prototype.showNotification = function(title, options = {}) {
    if (isDnd || !notificationSettings.desktopNotifications) {
      return Promise.resolve();
    }

    const { finalTitle, finalOptions } = processNotificationOptions(title, options);

    if (finalOptions.icon) {
      return new Promise((resolve) => {
        makeCircularAvatar(finalOptions.icon, (circularIcon) => {
          finalOptions.icon = circularIcon;
          origShowNotification.call(this, finalTitle, finalOptions).then(resolve).catch(resolve);
        });
      });
    }

    return origShowNotification.call(this, finalTitle, finalOptions);
  };
}
