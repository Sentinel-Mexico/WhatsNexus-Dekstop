const { ipcRenderer } = require('electron');

let lastProfilePic = null;
let lastProfileName = null;
let observer = null;
let intervalId = null;
let attempts = 0;
const MAX_ATTEMPTS = 30; // Máximo ~5 minutos de reintentos lentos

// ========================================================
// 1. Puente de Interceptación en el Contexto Principal (Main World)
// ========================================================
function injectMainWorldNotificationBridge() {
  try {
    const script = document.createElement('script');
    script.textContent = `
(function() {
  function dispatchToHost(title, options) {
    try {
      window.dispatchEvent(new CustomEvent('whats-nexus-notification', {
        detail: {
          title: title || 'WhatsApp',
          options: options ? {
            body: options.body,
            icon: options.icon,
            tag: options.tag,
            silent: options.silent
          } : {}
        }
      }));
    } catch(e) {}
  }

  // Interceptar window.Notification
  const OrigNotification = window.Notification;
  window.Notification = function(title, options) {
    dispatchToHost(title, options);
    return {
      onclick: null,
      onclose: null,
      onerror: null,
      onshow: null,
      addEventListener: function() {},
      removeEventListener: function() {},
      close: function() {}
    };
  };
  window.Notification.permission = 'granted';
  window.Notification.requestPermission = function() { return Promise.resolve('granted'); };

  // Interceptar ServiceWorkerRegistration.prototype.showNotification
  if (window.ServiceWorkerRegistration && window.ServiceWorkerRegistration.prototype.showNotification) {
    window.ServiceWorkerRegistration.prototype.showNotification = function(title, options) {
      dispatchToHost(title, options);
      return Promise.resolve();
    };
  }
})();
`;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
  } catch (e) {
    console.error('Error injecting notification bridge:', e);
  }
}

// Inyectar de inmediato y reforzar en DOMContentLoaded
injectMainWorldNotificationBridge();
window.addEventListener('DOMContentLoaded', injectMainWorldNotificationBridge);

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

// ========================================================
// 4. Procesamiento de Notificaciones y Recorte Circular
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

// Escuchar el evento de notificación proveniente del contexto principal
window.addEventListener('whats-nexus-notification', (event) => {
  const detail = event.detail || {};
  const rawTitle = detail.title || 'WhatsApp';
  const rawOptions = detail.options || {};

  if (rawOptions.icon) {
    makeCircularAvatar(rawOptions.icon, (circularIcon) => {
      ipcRenderer.sendToHost('guest-notification', {
        title: rawTitle,
        body: rawOptions.body || '',
        iconDataUrl: circularIcon
      });
    });
  } else {
    ipcRenderer.sendToHost('guest-notification', {
      title: rawTitle,
      body: rawOptions.body || '',
      iconDataUrl: null
    });
  }
});
