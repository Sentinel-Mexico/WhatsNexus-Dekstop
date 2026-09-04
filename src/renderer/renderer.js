// Fallback si corre fuera de Electron (src/preload-main.js expone window.electronAPI)
if (typeof window.electronAPI === 'undefined') {
  window.electronAPI = {
    appInfo: { version: '', appVersion: '', platform: 'linux', arch: 'x64', electronVersion: 'N/A', chromeVersion: 'N/A' },
    webviewPreloadPath: '',
    updateTrayBadge: () => {},
    setThemeMode: () => {},
    updatePermissionSettings: () => {},
    updateTraySettings: () => {},
    showNativeNotification: () => {},
    openExternal: (url) => window.open(url, '_blank'),
    onSelectAccount: () => {}
  };
}


// S-03: Sanitization helper to prevent XSS via innerHTML
function escapeHtml(str) {
  if (typeof str !== 'string') return str == null ? '' : String(str);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Idiomas soportados (Los 25 más hablados del mundo en orden proporcional)
const supportedLanguages = [
  'en', 'zh', 'hi', 'es', 'fr',
  'ar', 'bn', 'pt', 'ru', 'ur',
  'id', 'de', 'ja', 'mr', 'te',
  'tr', 'ta', 'yue', 'vi', 'fil',
  'ko', 'fa', 'ha', 'sw', 'it'
];

// Nombres nativos de cada idioma
const nativeNames = {
  en: "English",
  zh: "中文 (普通话)",
  hi: "हिन्दी",
  es: "Español",
  fr: "Français",
  ar: "العربية",
  bn: "বাংলা",
  pt: "Português",
  ru: "Русский",
  ur: "اردو",
  id: "Bahasa Indonesia",
  de: "Deutsch",
  ja: "日本語",
  mr: "मराठी",
  te: "తెలుగు",
  tr: "Türkçe",
  ta: "தமிழ்",
  yue: "粵語 (廣東話)",
  vi: "Tiếng Việt",
  fil: "Filipino",
  ko: "한국어",
  fa: "فارسی",
  ha: "Hausa",
  sw: "Kiswahili",
  it: "Italiano"
};

function getOSLanguage() {
  const lang = navigator.language.split('-')[0];
  return supportedLanguages.includes(lang) ? lang : 'en';
}

// El estado de nuestras cuentas
let accounts = JSON.parse(localStorage.getItem('whatsNexusAccounts')) || [];
let activeAccountId = null;
const HIBERNATION_TIMEOUT = 20 * 60 * 1000; // 20 minutos (en milisegundos)

// Settings
let settings = JSON.parse(localStorage.getItem('whatsNexusSettings')) || {
  theme: 'theme-dark',
  language: getOSLanguage(),
  privacy: 'broad'
};

if (!settings.notifications) {
  const legacyPrivacy = settings.privacy || 'broad';
  settings.notifications = {
    preset: legacyPrivacy,
    desktopNotifications: true,
    contactPhoto: legacyPrivacy !== 'strict',
    contactName: legacyPrivacy !== 'strict',
    messagePreview: legacyPrivacy === 'broad',
    notificationSound: legacyPrivacy !== 'strict',
    supportReminders: true
  };
}

if (!settings.permissions) {
  settings.permissions = {
    microphone: true,
    camera: false,
    location: false,
    screenShare: true,
    screenShareAudio: false
  };
}

if (settings.downloadPath === undefined) {
  settings.downloadPath = '';
}

if (settings.spellcheckLanguages === undefined) {
  if (settings.spellcheckLanguage) {
    settings.spellcheckLanguages = [settings.spellcheckLanguage];
  } else {
    settings.spellcheckLanguages = ['es-ES'];
  }
}

// URLs para donaciones y apoyo externo (reemplazar con los enlaces deseados)
const DONATION_URLS = {
  github: 'https://github.com/sponsors/Sentinel-Mexico', // Reemplazar con tu enlace de GitHub Sponsors
  paypal: 'https://www.paypal.me/SentinelMexico',       // Reemplazar con tu enlace de PayPal
  kofi:   'https://ko-fi.com/sentinelmexico'            // Reemplazar con tu enlace de Ko-fi
};

// ==========================================================================
// Sistema de Traducción Dinámica (Lazy Loading - P-01)
// ==========================================================================
let i18n = {};
let fallbackTranslations = {};
let currentTranslations = {};

async function fetchLocaleJson(langCode) {
  const code = (langCode || 'en').trim();
  if (window.electronAPI && window.electronAPI.loadLocale) {
    try {
      const data = await window.electronAPI.loadLocale(code);
      if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        return data;
      }
    } catch (ipcErr) {
      console.error(`[fetchLocaleJson IPC Error]: Falló al solicitar idioma "${code}":`, ipcErr);
    }
  }

  const baseCode = code.split('-')[0].split('_')[0];
  const candidates = [code, code.toLowerCase(), baseCode];
  for (const c of candidates) {
    try {
      const res = await fetch(`../locales/${c}.json`);
      if (res.ok) {
        const json = await res.json();
        if (json && typeof json === 'object' && Object.keys(json).length > 0) {
          return json;
        }
      }
    } catch (fetchErr) {
      console.error(`[fetchLocaleJson Fetch Error]: Falló la lectura de "../locales/${c}.json":`, fetchErr);
    }
  }

  console.error(`[fetchLocaleJson Error]: No se encontró archivo de traducción para "${code}"`);
  return {};
}

async function loadActiveLocale(langCode) {
  try {
    const code = langCode || 'en';
    if (!fallbackTranslations || Object.keys(fallbackTranslations).length === 0) {
      try {
        fallbackTranslations = (await fetchLocaleJson('en')) || {};
      } catch (err) {
        console.error('[loadActiveLocale Error]: Error al cargar fallback "en":', err);
        fallbackTranslations = {};
      }
    }

    let activeData = {};
    if (code === 'en') {
      activeData = fallbackTranslations;
    } else {
      try {
        activeData = (await fetchLocaleJson(code)) || {};
      } catch (err) {
        console.error(`[loadActiveLocale Error]: Error al cargar idioma "${code}":`, err);
        activeData = {};
      }
    }

    currentTranslations = { ...fallbackTranslations, ...activeData };

    // Liberar memoria: retener únicamente el idioma activo y el fallback en i18n
    i18n = {};
    i18n['en'] = fallbackTranslations;
    i18n[code] = currentTranslations;
    const baseCode = code.split('-')[0].split('_')[0];
    if (baseCode !== code) {
      i18n[baseCode] = currentTranslations;
    }
    return currentTranslations;
  } catch (fatalErr) {
    console.error(`[loadActiveLocale Fatal Error] para "${langCode}":`, fatalErr);
    return fallbackTranslations || {};
  }
}

function populateLanguageSelect() {
  const langSelect = document.getElementById('language-select');
  const customOptions = document.getElementById('language-select-options');
  const triggerLabel = document.getElementById('language-select-label');
  const trigger = document.getElementById('language-select-trigger');
  
  if (langSelect) langSelect.innerHTML = '';
  if (customOptions) customOptions.innerHTML = '';
  
  const currentLangCode = settings.language || 'en';
  const dict = i18n[currentLangCode] || i18n['en'] || {};
  
  supportedLanguages.forEach(code => {
    const translatedName = dict[`lang_${code}`] || nativeNames[code] || code;
    const nativeName = nativeNames[code] || code;
    const displayText = `${translatedName} (${nativeName})`;

    // Select nativo oculto
    if (langSelect) {
      const option = document.createElement('option');
      option.value = code;
      option.innerText = displayText;
      langSelect.appendChild(option);
    }

    // Selector visual personalizado
    if (customOptions) {
      const customOpt = document.createElement('div');
      customOpt.className = 'custom-option' + (code === currentLangCode ? ' selected' : '');
      customOpt.innerText = displayText;
      customOpt.dataset.value = code;

      customOpt.addEventListener('click', async (e) => {
        e.stopPropagation();
        const selectedCode = customOpt.dataset.value || code;
        try {
          await loadActiveLocale(selectedCode);
          settings.language = selectedCode;
          saveSettings();
          updateTranslations();
        } catch (err) {
          console.error(`[Language Selector Click Error] para "${selectedCode}":`, err);
        }
        if (customOptions) customOptions.classList.remove('open');
        if (trigger) trigger.classList.remove('open');
      });

      customOptions.appendChild(customOpt);
    }
  });
  
  if (langSelect) {
    langSelect.value = currentLangCode;
    langSelect.onchange = async (e) => {
      const selectedCode = (e && e.target && e.target.value) ? e.target.value : langSelect.value;
      try {
        await loadActiveLocale(selectedCode);
        settings.language = selectedCode;
        saveSettings();
        updateTranslations();
      } catch (err) {
        console.error(`[Language Selector Change Error] para "${selectedCode}":`, err);
      }
    };
  }
  if (triggerLabel) {
    const activeTranslated = dict[`lang_${currentLangCode}`] || nativeNames[currentLangCode] || currentLangCode;
    const activeNative = nativeNames[currentLangCode] || currentLangCode;
    triggerLabel.innerText = `${activeTranslated} (${activeNative})`;
  }
}

const SPELLCHECK_LANGUAGES = [
  // Español: es, es-AR (Argentina 🇦🇷), es-ES (España 🇪🇸), es-MX (México 🇲🇽), es-US (EE.UU. 🇺🇸), es-419 (Latinoamérica 🌎)
  { code: 'es', flag: '🇪🇸', base: 'es' },
  { code: 'es-AR', flag: '🇦🇷', base: 'es', regionKey: 'region_argentina', defaultRegion: 'Argentina' },
  { code: 'es-ES', flag: '🇪🇸', base: 'es', regionKey: 'region_spain', defaultRegion: 'España' },
  { code: 'es-MX', flag: '🇲🇽', base: 'es', regionKey: 'region_mexico', defaultRegion: 'México' },
  { code: 'es-US', flag: '🇺🇸', base: 'es', regionKey: 'region_us', defaultRegion: 'EE.UU.' },
  { code: 'es-419', flag: '🌎', base: 'es', regionKey: 'region_latam', defaultRegion: 'Latinoamérica' },

  // Inglés: en-US (EE.UU. 🇺🇸), en-GB (Reino Unido 🇬🇧), en-CA (Canadá 🇨🇦), en-AU (Australia 🇦🇺), en-IN (India 🇮🇳), en-NZ (Nueva Zelanda 🇳🇿), en-ZA (Sudáfrica 🇿🇦)
  { code: 'en-US', flag: '🇺🇸', base: 'en', regionKey: 'region_us', defaultRegion: 'EE.UU.' },
  { code: 'en-GB', flag: '🇬🇧', base: 'en', regionKey: 'region_uk', defaultRegion: 'Reino Unido' },
  { code: 'en-CA', flag: '🇨🇦', base: 'en', regionKey: 'region_ca', defaultRegion: 'Canadá' },
  { code: 'en-AU', flag: '🇦🇺', base: 'en', regionKey: 'region_au', defaultRegion: 'Australia' },
  { code: 'en-IN', flag: '🇮🇳', base: 'en', regionKey: 'region_in', defaultRegion: 'India' },
  { code: 'en-NZ', flag: '🇳🇿', base: 'en', regionKey: 'region_nz', defaultRegion: 'Nueva Zelanda' },
  { code: 'en-ZA', flag: '🇿🇦', base: 'en', regionKey: 'region_za', defaultRegion: 'Sudáfrica' },

  // Portugués: pt-BR (Brasil 🇧🇷), pt-PT (Portugal 🇵🇹)
  { code: 'pt-BR', flag: '🇧🇷', base: 'pt', regionKey: 'region_brazil', defaultRegion: 'Brasil' },
  { code: 'pt-PT', flag: '🇵🇹', base: 'pt', regionKey: 'region_portugal', defaultRegion: 'Portugal' },

  // Francés: fr, fr-FR (Francia 🇫🇷), fr-CA (Canadá 🇨🇦), fr-CH (Suiza 🇨🇭)
  { code: 'fr', flag: '🇫🇷', base: 'fr' },
  { code: 'fr-FR', flag: '🇫🇷', base: 'fr', regionKey: 'region_france', defaultRegion: 'Francia' },
  { code: 'fr-CA', flag: '🇨🇦', base: 'fr', regionKey: 'region_ca', defaultRegion: 'Canadá' },
  { code: 'fr-CH', flag: '🇨🇭', base: 'fr', regionKey: 'region_switzerland', defaultRegion: 'Suiza' },

  // Alemán: de, de-DE (Alemania 🇩🇪), de-AT (Austria 🇦🇹), de-CH (Suiza 🇨🇭)
  { code: 'de', flag: '🇩🇪', base: 'de' },
  { code: 'de-DE', flag: '🇩🇪', base: 'de', regionKey: 'region_germany', defaultRegion: 'Alemania' },
  { code: 'de-AT', flag: '🇦🇹', base: 'de', regionKey: 'region_austria', defaultRegion: 'Austria' },
  { code: 'de-CH', flag: '🇨🇭', base: 'de', regionKey: 'region_switzerland', defaultRegion: 'Suiza' },

  // Italiano / Ruso: it, it-IT (Italia 🇮🇹), ru, ru-RU (Rusia 🇷🇺)
  { code: 'it', flag: '🇮🇹', base: 'it' },
  { code: 'it-IT', flag: '🇮🇹', base: 'it', regionKey: 'region_italy', defaultRegion: 'Italia' },
  { code: 'ru', flag: '🇷🇺', base: 'ru' },
  { code: 'ru-RU', flag: '🇷🇺', base: 'ru', regionKey: 'region_russia', defaultRegion: 'Rusia' },

  // Árabe / Persa: ar (🇸🇦), fa (🇮🇷)
  { code: 'ar', flag: '🇸🇦', base: 'ar' },
  { code: 'fa', flag: '🇮🇷', base: 'fa' },

  // Asiáticos / Otros: hi (Hindi 🇮🇳), id (Indonesio 🇮🇩), ko (Coreano 🇰🇷), ta (Tamil 🇮🇳), tr (Turco 🇹🇷), vi (Vietnamita 🇻🇳)
  { code: 'hi', flag: '🇮🇳', base: 'hi' },
  { code: 'id', flag: '🇮🇩', base: 'id' },
  { code: 'ko', flag: '🇰🇷', base: 'ko' },
  { code: 'ta', flag: '🇮🇳', base: 'ta' },
  { code: 'tr', flag: '🇹🇷', base: 'tr' },
  { code: 'vi', flag: '🇻🇳', base: 'vi' }
];

function renderSpellcheckList() {
  const container = document.getElementById('spellcheck-multiselect-container');
  if (!container) return;

  container.innerHTML = '';
  const currentLang = settings.language || 'es';
  const dict = i18n[currentLang] || i18n['en'] || {};

  if (!Array.isArray(settings.spellcheckLanguages)) {
    if (settings.spellcheckLanguage) {
      settings.spellcheckLanguages = [settings.spellcheckLanguage];
    } else {
      settings.spellcheckLanguages = ['es-ES'];
    }
  }

  const selectedSet = new Set(settings.spellcheckLanguages);

  // Mapear cada elemento con su nombre traducido formateado
  const items = SPELLCHECK_LANGUAGES.map(item => {
    const langName = dict[`lang_${item.base}`] || nativeNames[item.base] || item.base;
    let labelContent = langName;
    if (item.regionKey) {
      const regionText = dict[item.regionKey] || item.defaultRegion;
      labelContent += ` (${regionText})`;
    }
    return {
      ...item,
      nombreTraducido: labelContent
    };
  });

  // Ordenamiento alfabético dinámico estricto basado en el texto traducido que el usuario ve
  items.sort((a, b) => a.nombreTraducido.localeCompare(b.nombreTraducido, currentLang));

  items.forEach(item => {
    const itemLabel = document.createElement('label');
    itemLabel.className = 'spellcheck-checkbox-item' + (selectedSet.has(item.code) ? ' selected' : '');

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'spellcheck-cb';
    cb.value = item.code;
    cb.checked = selectedSet.has(item.code);

    const flagSpan = document.createElement('span');
    flagSpan.className = 'spellcheck-item-flag';
    flagSpan.innerText = item.flag;

    const nameSpan = document.createElement('span');
    nameSpan.className = 'spellcheck-item-name';
    nameSpan.innerText = item.nombreTraducido;

    cb.addEventListener('change', () => {
      const currentSelected = new Set(settings.spellcheckLanguages || []);
      if (cb.checked) {
        currentSelected.add(item.code);
        itemLabel.classList.add('selected');
      } else {
        currentSelected.delete(item.code);
        itemLabel.classList.remove('selected');
      }

      settings.spellcheckLanguages = Array.from(currentSelected);
      saveSettings();

      if (window.electronAPI && electronAPI.setSpellcheckerLanguages) {
        electronAPI.setSpellcheckerLanguages(settings.spellcheckLanguages);
      }
    });

    itemLabel.appendChild(cb);
    itemLabel.appendChild(flagSpan);
    itemLabel.appendChild(nameSpan);

    container.appendChild(itemLabel);
  });
}

function updateTranslations() {
  const lang = i18n[settings.language] || i18n['en'];
  
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (lang[key]) {
      if (el.tagName === 'INPUT' && el.type === 'text') {
        el.placeholder = lang[key];
      } else {
        el.innerText = lang[key];
      }
    }
  });

  populateLanguageSelect();
  renderSpellcheckList();
  renderSettingsAccounts();
  if (typeof loadAboutInfo === 'function') {
    loadAboutInfo();
  }
  if (typeof refreshAllCustomDropdowns === 'function') {
    refreshAllCustomDropdowns();
  }
}

const accountList = document.getElementById('account-list');
const addAccountBtn = document.getElementById('add-account-btn');
const reportBugBtn = document.getElementById('report-bug-btn');
const donateBtn = document.getElementById('donate-btn');
const settingsBtn = document.getElementById('settings-btn');
const webviewContainer = document.getElementById('webview-container');
const emptyState = document.getElementById('empty-state');

const settingsView = document.getElementById('settings-view');
const backToChatsBtn = document.getElementById('back-to-chats-btn');
const donationsView = document.getElementById('donations-view');
const backFromDonationsBtn = document.getElementById('back-from-donations-btn');
const tabBtns = document.querySelectorAll('.tab-btn');
const settingsPanels = document.querySelectorAll('.settings-panel');
const settingsAccountList = document.getElementById('settings-account-list');

const themeSelect = document.getElementById('theme-select');
const paletteSelect = document.getElementById('palette-select');
const languageSelect = document.getElementById('language-select');
const trayStyleSelect = document.getElementById('tray-style-select');
const trayBadgeToggle = document.getElementById('tray-badge-toggle');

const privacyPresetSelect = document.getElementById('privacy-preset-select');
const notifDesktopToggle = document.getElementById('notif-desktop-toggle');
const notifPhotoToggle = document.getElementById('notif-photo-toggle');
const notifNameToggle = document.getElementById('notif-name-toggle');
const notifPreviewToggle = document.getElementById('notif-preview-toggle');
const notifSoundToggle = document.getElementById('notif-sound-toggle');

// Elementos de la Pestaña Permisos / Sistema
const permAllowAllBtn = document.getElementById('perm-allow-all-btn');
const permDenyAllBtn = document.getElementById('perm-deny-all-btn');
const permMicToggle = document.getElementById('perm-mic-toggle');
const permCameraToggle = document.getElementById('perm-camera-toggle');
const permLocationToggle = document.getElementById('perm-location-toggle');
const permScreenToggle = document.getElementById('perm-screen-toggle');
const permScreenAudioToggle = document.getElementById('perm-screen-audio-toggle');

const downloadPathInput = document.getElementById('download-path-input');
const btnSelectDownloadDir = document.getElementById('btn-select-download-dir');
const btnResetDownloadDir = document.getElementById('btn-reset-download-dir');

// Rastreo de mensajes no leídos por cuenta para el System Tray
const accountUnreadCounts = {};

function updateTotalUnread() {
  let total = 0;
  accounts.forEach(acc => {
    if (acc.enabled !== false && !acc.dnd) {
      total += (accountUnreadCounts[acc.id] || 0);
    }
  });
  electronAPI.updateTrayBadge(total);
}

async function initDownloadPathUI() {
  if (!downloadPathInput) return;

  if (window.electronAPI && electronAPI.getSystemSettings) {
    try {
      const sys = await electronAPI.getSystemSettings();
      if (sys && sys.downloadPath) {
        settings.downloadPath = sys.downloadPath;
        downloadPathInput.value = sys.downloadPath;
      }
      if (sys && Array.isArray(sys.spellcheckLanguages)) {
        settings.spellcheckLanguages = sys.spellcheckLanguages;
      } else if (sys && sys.spellcheckLanguage) {
        settings.spellcheckLanguages = [sys.spellcheckLanguage];
      }
    } catch (_) {}
  }

  if ((!downloadPathInput.value || !settings.downloadPath) && window.electronAPI && electronAPI.getDefaultDownloadsPath) {
    try {
      const defPath = await electronAPI.getDefaultDownloadsPath();
      if (defPath) {
        settings.downloadPath = defPath;
        downloadPathInput.value = defPath;
      }
    } catch (_) {}
  }

  if (settings.downloadPath && (!downloadPathInput.value || downloadPathInput.value === '')) {
    downloadPathInput.value = settings.downloadPath;
  }
}

function getEffectiveThemeIsDark() {
  if (settings.theme === 'theme-dark') return true;
  if (settings.theme === 'theme-light') return false;

  // Modo Automático (Sistema)
  if (window.electronAPI && typeof window.electronAPI.systemIsDark === 'boolean') {
    return window.electronAPI.systemIsDark;
  }
  if (window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return true;
}

async function init() {
  if (window.electronAPI && electronAPI.getSystemTheme) {
    try {
      const themeInfo = await electronAPI.getSystemTheme();
      if (themeInfo && typeof themeInfo.shouldUseDarkColors === 'boolean') {
        window.electronAPI.systemIsDark = themeInfo.shouldUseDarkColors;
      }
    } catch (_) {}
  }

  await loadActiveLocale(settings.language || 'es');
  applySettings();
  initDownloadPathUI();
  renderSpellcheckList();
  loadAboutInfo();
  if (electronAPI.setSpellcheckerLanguages) {
    electronAPI.setSpellcheckerLanguages(settings.spellcheckLanguages || ['es-ES']);
  }
  
  // Garantizar propiedad enabled en cuentas existentes
  accounts.forEach(acc => {
    if (acc.enabled === undefined) acc.enabled = true;
  });

  if (accounts.length === 0) {
    const lang = i18n[settings.language] || i18n['en'];
    addAccount(`${lang.default_account_name} 1`);
  } else {
    // Solo cuentas activadas pueden mostrarse y seleccionarse
    const enabledAccounts = accounts.filter(a => a.enabled !== false);
    const savedActiveId = localStorage.getItem('whatsNexusActiveAccount');
    const targetActiveId = (savedActiveId && enabledAccounts.some(a => a.id === savedActiveId))
      ? savedActiveId
      : (enabledAccounts.length > 0 ? enabledAccounts[0].id : null);

    renderAllSidebarAccounts();

    accounts.forEach(acc => {
      acc.lastAccessed = Date.now();
      // Lazy loading: solo instanciamos el webview si está habilitada y es el objetivo inicial
      const isTarget = (acc.id === targetActiveId && acc.enabled !== false);
      acc.hibernated = !isTarget;
      createWebviewContainer(acc, !isTarget);
    });

    if (targetActiveId) {
      activateAccount(targetActiveId);
    } else {
      activateAccount(null);
    }
  }

  // Hibernation checker every 1 minute
  setInterval(checkHibernation, 60 * 1000);
}

function saveAccounts() {
  // Garantizar persistencia limpia sin estados transitorios
  const toSave = accounts.map(a => ({
    id: a.id,
    name: a.name,
    partition: a.partition,
    avatarUrl: a.avatarUrl,
    dnd: a.dnd,
    enabled: a.enabled !== false,
    isCustomNamed: !!a.isCustomNamed
  }));
  localStorage.setItem('whatsNexusAccounts', JSON.stringify(toSave));
}

function saveSettings() {
  localStorage.setItem('whatsNexusSettings', JSON.stringify(settings));
  applySettings();
}

function applySettings() {
  const isAuto = (settings.theme === 'theme-auto' || !settings.theme);
  const isDark = getEffectiveThemeIsDark();

  const palette = settings.themePalette || 'whatsapp';
  
  // Establecer paleta y modo de luz/oscuridad en el body
  document.body.className = `palette-${palette} ${isDark ? 'theme-dark' : 'theme-light'}`;
  
  if (themeSelect) themeSelect.value = settings.theme || 'theme-auto';
  if (paletteSelect) paletteSelect.value = palette;
  if (trayStyleSelect) trayStyleSelect.value = settings.trayStyle || 'auto';
  if (trayBadgeToggle) trayBadgeToggle.checked = settings.trayShowBadge !== false;
  if (downloadPathInput && settings.downloadPath) downloadPathInput.value = settings.downloadPath;

  // Sincronizar UI de Notificaciones
  if (settings.notifications) {
    if (privacyPresetSelect) privacyPresetSelect.value = settings.notifications.preset || 'broad';
    if (notifDesktopToggle) notifDesktopToggle.checked = settings.notifications.desktopNotifications !== false;
    if (notifPhotoToggle) notifPhotoToggle.checked = settings.notifications.contactPhoto !== false;
    if (notifNameToggle) notifNameToggle.checked = settings.notifications.contactName !== false;
    if (notifPreviewToggle) notifPreviewToggle.checked = settings.notifications.messagePreview !== false;
    if (notifSoundToggle) notifSoundToggle.checked = settings.notifications.notificationSound !== false;

    // Atenuar controles secundarios si las notificaciones de escritorio están apagadas
    const isDesktopEnabled = settings.notifications.desktopNotifications !== false;
    document.querySelectorAll('.notif-sub-option').forEach(el => {
      if (!isDesktopEnabled) {
        el.classList.add('dimmed');
      } else {
        el.classList.remove('dimmed');
      }
    });

    // Enviar configuración a las webviews activas
    document.querySelectorAll('webview').forEach(wv => {
      try {
        wv.send('update-notification-settings', settings.notifications);
        wv.send('set-dark-mode', isDark);
      } catch (_) {}
    });

    accounts.forEach(acc => {
      const wv = document.getElementById(`webview_${acc.id}`);
      if (wv) {
        try {
          wv.send('update-account-settings', { dnd: !!acc.dnd });
        } catch (_) {}
      }
    });
  }

  // Sincronizar modo oscuro/claro a nivel global de Chromium y Electron
  if (window.electronAPI && electronAPI.setThemeMode) {
    electronAPI.setThemeMode(isAuto ? 'system' : (isDark ? 'dark' : 'light'));
  }

  if (typeof refreshAllCustomDropdowns === 'function') {
    refreshAllCustomDropdowns();
  }

  // Sincronizar UI de Permisos
  if (settings.permissions) {
    if (permMicToggle) permMicToggle.checked = settings.permissions.microphone !== false;
    if (permCameraToggle) permCameraToggle.checked = !!settings.permissions.camera;
    if (permLocationToggle) permLocationToggle.checked = !!settings.permissions.location;
    if (permScreenToggle) permScreenToggle.checked = settings.permissions.screenShare !== false;
    if (permScreenAudioToggle) permScreenAudioToggle.checked = !!settings.permissions.screenShareAudio;

    // Sincronizar permisos con el proceso principal
    electronAPI.updatePermissionSettings(settings.permissions);
  }

  // Sincronizar apariencia de la bandeja con el proceso principal
  electronAPI.updateTraySettings({
    style: settings.trayStyle || 'auto',
    showBadge: settings.trayShowBadge !== false
  });
  
  updateTranslations();
  updateTotalUnread();
}

function addAccount(name = null) {
  const accountId = 'acc_' + Date.now();
  const lang = i18n[settings.language] || i18n['en'];
  const accountName = name || `${lang.default_account_name} ${accounts.length + 1}`;
  
  const account = {
    id: accountId,
    name: accountName,
    partition: `persist:${accountId}`,
    avatarUrl: null,
    dnd: false,
    enabled: true,
    lastAccessed: Date.now(),
    hibernated: false
  };
  
  accounts.push(account);
  saveAccounts();
  
  renderAllSidebarAccounts();
  createWebviewContainer(account);
  
  if (!name) {
    activateAccount(accountId);
  }
  renderSettingsAccounts();
}

function getAvatarHtml(account) {
  if (account && account.avatarUrl) {
    return `<img src="${escapeHtml(account.avatarUrl)}" alt="Avatar">`;
  }
  return `<i class="fa-solid fa-circle-user"></i>`;
}

function renderAllSidebarAccounts() {
  accountList.innerHTML = '';
  accounts.forEach(acc => {
    if (acc.enabled !== false) {
      renderAccountSidebarItem(acc);
    }
  });

  if (activeAccountId) {
    document.querySelectorAll('.account-item').forEach(item => {
      if (item.dataset.id === activeAccountId) item.classList.add('active');
      else item.classList.remove('active');
    });
  }
}

// Globo de texto / Tooltip flotante desacoplado del overflow de la sidebar
const floatingTooltip = document.createElement('div');
floatingTooltip.className = 'sidebar-floating-tooltip';
document.body.appendChild(floatingTooltip);

// Posición unificada: exactamente a 8px del límite derecho de la sidebar
const TOOLTIP_GAP = 8; // px desde el borde derecho de la sidebar

function getSidebarRight() {
  const sidebar = document.querySelector('.sidebar');
  return sidebar ? sidebar.getBoundingClientRect().right : 76;
}

function attachSidebarTooltip(el, getTooltipText) {
  el.addEventListener('mouseenter', () => {
    const rect = el.getBoundingClientRect();
    const text = typeof getTooltipText === 'function' ? getTooltipText() : getTooltipText;
    floatingTooltip.innerText = text;
    floatingTooltip.style.top = `${rect.top + rect.height / 2}px`;
    floatingTooltip.style.left = `${getSidebarRight() + TOOLTIP_GAP}px`;
    floatingTooltip.classList.add('visible');
  });
  el.addEventListener('mouseleave', () => {
    floatingTooltip.classList.remove('visible');
  });
}

// Inicializar tooltips unificados para los botones inferiores de la sidebar
function initSidebarBottomTooltips() {
  const addBtn = document.getElementById('add-account-btn');
  const bugBtn = document.getElementById('report-bug-btn');
  const setBtn = document.getElementById('settings-btn');

  if (addBtn) {
    attachSidebarTooltip(addBtn, () => (i18n[settings.language] || i18n['es'])?.tooltip_add_account || 'Añadir Cuenta');
    addBtn.addEventListener('click', () => floatingTooltip.classList.remove('visible'));
  }
  if (bugBtn) {
    attachSidebarTooltip(bugBtn, () => (i18n[settings.language] || i18n['es'])?.tooltip_report_bug || 'Reportar Error');
    bugBtn.addEventListener('click', () => floatingTooltip.classList.remove('visible'));
  }
  const donBtn = document.getElementById('donate-btn');
  if (donBtn) {
    attachSidebarTooltip(donBtn, () => (i18n[settings.language] || i18n['es'])?.tooltip_donations || 'Donaciones');
    donBtn.addEventListener('click', () => floatingTooltip.classList.remove('visible'));
  }
  if (setBtn) {
    attachSidebarTooltip(setBtn, () => (i18n[settings.language] || i18n['es'])?.tooltip_settings || 'Configuración');
    setBtn.addEventListener('click', () => floatingTooltip.classList.remove('visible'));
  }
}

initSidebarBottomTooltips();

function renderAccountSidebarItem(account) {
  const li = document.createElement('li');
  li.className = 'account-item';
  li.dataset.id = account.id;
  li.title = account.name;
  
  li.innerHTML = `
    <div class="account-avatar" id="avatar_${account.id}">
      ${getAvatarHtml(account)}
    </div>
  `;

  attachSidebarTooltip(li, () => {
    const currentAcc = accounts.find(a => a.id === account.id) || account;
    return currentAcc.name || 'WhatsApp';
  });
  
  li.addEventListener('click', () => {
    floatingTooltip.classList.remove('visible');
    activateAccount(account.id);
  });
  
  accountList.appendChild(li);
}

function updateAccountSidebarItem(account) {
  const avatarDiv = document.getElementById(`avatar_${account.id}`);
  if (avatarDiv) {
    avatarDiv.innerHTML = getAvatarHtml(account);
  }
  const li = document.querySelector(`.account-item[data-id="${account.id}"]`);
  if (li) {
    li.title = account.name;
  }
}

function createWebviewContainer(account, startHibernated = false) {
  const container = document.createElement('div');
  container.id = `container_${account.id}`;
  container.className = 'account-container hidden'; // By default hidden
  
  const lang = i18n[settings.language] || i18n['en'];
  
  // Overlay de Hibernación (Visible si startHibernated es true)
  const overlay = document.createElement('div');
  overlay.className = `hibernation-overlay ${startHibernated ? '' : 'hidden'}`;
  overlay.id = `hibernation_${account.id}`;
  overlay.innerHTML = `
    <i class="fa-solid fa-moon hibernation-icon"></i>
    <h3 data-i18n="hibernation_title">${escapeHtml(lang.hibernation_title)}</h3>
    <p data-i18n="hibernation_desc">${escapeHtml(lang.hibernation_desc)}</p>
    <button class="wake-btn" onclick="wakeWebview('${escapeHtml(account.id)}')" data-i18n="wake_button">${escapeHtml(lang.wake_button)}</button>
  `;
  
  container.appendChild(overlay);
  webviewContainer.appendChild(container);

  // Solo crear el webview en el DOM si NO empieza hibernado (Lazy Loading)
  if (!startHibernated) {
    buildWebviewDOM(account, container);
  }
}

function buildWebviewDOM(account, parentContainer) {
  const webview = document.createElement('webview');
  webview.id = `webview_${account.id}`;
  webview.setAttribute('src', 'https://web.whatsapp.com/');
  webview.setAttribute('partition', account.partition);
  webview.setAttribute('webpreferences', 'backgroundThrottling=yes, contextIsolation=no'); // CRITICO: Throttling de memoria y acceso a contexto principal
  
  const preloadPath = electronAPI.webviewPreloadPath || '';
  if (preloadPath) {
    webview.setAttribute('preload', preloadPath);
  }
  webview.setAttribute('useragent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  webview.className = 'webview-active';

  // Sincronizar configuración de notificaciones, DND y tema al cargar la sesión
  webview.addEventListener('dom-ready', () => {
    const isDark = getEffectiveThemeIsDark();
    try {
      if (settings && settings.notifications) {
        webview.send('update-notification-settings', settings.notifications);
      }
      webview.send('update-account-settings', { dnd: !!account.dnd });
      webview.send('set-dark-mode', isDark);
    } catch (_) {}
  });

  // Detección reactiva de mensajes no leídos mediante el título de la página
  webview.addEventListener('page-title-updated', (e) => {
    const match = e.title.match(/\((\d+)\)/);
    const unread = match ? parseInt(match[1], 10) : 0;
    accountUnreadCounts[account.id] = unread;
    updateTotalUnread();
  });

  webview.addEventListener('ipc-message', (event) => {
    if (event.channel === 'profile-picture-updated') {
      const imgUrl = event.args[0];
      const acc = accounts.find(a => a.id === account.id);
      if (acc && acc.avatarUrl !== imgUrl) {
        acc.avatarUrl = imgUrl;
        saveAccounts();
        updateAccountSidebarItem(acc);
        renderSettingsAccounts();
      }
    } else if (event.channel === 'profile-name-updated') {
      const newName = event.args[0];
      const acc = accounts.find(a => a.id === account.id);
      if (acc && newName && acc.name !== newName) {
        const lang = i18n[settings.language] || i18n['en'];
        const isGenericName = !acc.isCustomNamed || 
                              acc.name.startsWith(lang.default_account_name) ||
                              acc.name.startsWith('Account') ||
                              acc.name.startsWith('Cuenta') ||
                              acc.name.startsWith('+');
        if (isGenericName) {
          acc.name = newName;
          saveAccounts();
          updateAccountSidebarItem(acc);
          renderSettingsAccounts();
        }
      }
    } else if (event.channel === 'guest-notification') {
      const notifData = event.args[0] || {};
      const acc = accounts.find(a => a.id === account.id);

      // 1. REGLA AUTORITARIA: Si la cuenta está en NO MOLESTAR o desactivada, descartar de raíz
      if (!acc || acc.dnd || acc.enabled === false) {
        return;
      }

      // 2. Si las notificaciones de escritorio están apagadas globalmente, descartar
      if (!settings.notifications || settings.notifications.desktopNotifications === false) {
        return;
      }

      // 3. Aplicar filtros de privacidad de forma estricta
      let title = notifData.title || 'WhatsApp';
      let body = notifData.body || '';
      let iconDataUrl = notifData.iconDataUrl || null;
      let silent = false;

      // Nombre de contacto
      if (settings.notifications.contactName === false) {
        title = 'Nombre oculto';
      }

      // Vista previa del mensaje
      if (settings.notifications.messagePreview === false) {
        body = 'Mensaje oculto';
      }

      // Foto de contacto
      if (settings.notifications.contactPhoto === false) {
        iconDataUrl = null;
      }

      // Sonido de notificación
      if (settings.notifications.notificationSound === false) {
        silent = true;
      }

      // Despachar la notificación nativa con avatar circular al proceso principal
      electronAPI.showNativeNotification({
        title,
        body,
        iconDataUrl,
        silent,
        accountId: account.id
      });
    }
  });

  parentContainer.appendChild(webview);
}

function checkHibernation() {
  const now = Date.now();
  accounts.forEach(acc => {
    // Si la cuenta NO está activa en este momento y pasó el tiempo de inactividad
    if (activeAccountId !== acc.id && !acc.hibernated && (now - acc.lastAccessed > HIBERNATION_TIMEOUT)) {
      hibernateWebview(acc.id);
    }
  });
}

function hibernateWebview(id) {
  const acc = accounts.find(a => a.id === id);
  if (!acc) return;
  
  const webview = document.getElementById(`webview_${id}`);
  if (webview) {
    webview.remove(); // DESTRUCCIÓN TOTAL: Libera RAM.
  }
  accountUnreadCounts[id] = 0;
  updateTotalUnread();
  
  const overlay = document.getElementById(`hibernation_${id}`);
  if (overlay) {
    overlay.classList.remove('hidden');
  }
  
  acc.hibernated = true;
  console.log(`[Hibernation] Cuenta ${id} hibernada para ahorrar memoria.`);
}

window.wakeWebview = (id) => {
  const acc = accounts.find(a => a.id === id);
  if (!acc) return;
  
  acc.lastAccessed = Date.now();
  
  if (acc.hibernated) {
    const overlay = document.getElementById(`hibernation_${id}`);
    if (overlay) overlay.classList.add('hidden');
    
    const container = document.getElementById(`container_${id}`);
    if (container) buildWebviewDOM(acc, container);
    
    acc.hibernated = false;
    console.log(`[Hibernation] Cuenta ${id} despertada.`);
  }
};

function closeSettingsView() {
  if (settingsView) settingsView.classList.add('hidden');
  if (settingsBtn) settingsBtn.classList.remove('active');
}

function closeDonationsView() {
  if (donationsView) donationsView.classList.add('hidden');
  if (donateBtn) donateBtn.classList.remove('active');
}

function openDonationsView() {
  closeSettingsView();
  // Deactivate active account tab in sidebar and hide webviews
  document.querySelectorAll('.account-item').forEach(item => item.classList.remove('active'));
  document.querySelectorAll('.account-container').forEach(container => container.classList.add('hidden'));
  emptyState.classList.add('hidden');

  // Activate donations button in sidebar
  if (donateBtn) donateBtn.classList.add('active');
  if (donationsView) donationsView.classList.remove('hidden');
}

function openSettingsView() {
  closeDonationsView();
  // Deactivate active account tab in sidebar and hide webviews
  document.querySelectorAll('.account-item').forEach(item => item.classList.remove('active'));
  document.querySelectorAll('.account-container').forEach(container => container.classList.add('hidden'));
  emptyState.classList.add('hidden');

  // Activate settings button in sidebar
  if (settingsBtn) settingsBtn.classList.add('active');
  if (settingsView) settingsView.classList.remove('hidden');

  renderSettingsAccounts();
  initDownloadPathUI();
  loadAboutInfo();
}

function activateAccount(id) {
  closeSettingsView();
  closeDonationsView();

  if (!id) {
    activeAccountId = null;
    localStorage.removeItem('whatsNexusActiveAccount');
    document.querySelectorAll('.account-item').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.account-container').forEach(container => container.classList.add('hidden'));
    emptyState.classList.remove('hidden');
    return;
  }
  
  const targetAcc = accounts.find(a => a.id === id);
  if (!targetAcc || targetAcc.enabled === false) {
    const nextActive = accounts.find(a => a.enabled !== false);
    if (nextActive) {
      return activateAccount(nextActive.id);
    } else {
      return activateAccount(null);
    }
  }

  activeAccountId = id;
  localStorage.setItem('whatsNexusActiveAccount', id);
  emptyState.classList.add('hidden');

  document.querySelectorAll('.account-item').forEach(item => {
    if (item.dataset.id === id) item.classList.add('active');
    else item.classList.remove('active');
  });
  
  document.querySelectorAll('.account-container').forEach(container => {
    if (container.id === `container_${id}`) container.classList.remove('hidden');
    else container.classList.add('hidden');
  });
  
  if (targetAcc) {
    targetAcc.lastAccessed = Date.now();
    if (targetAcc.hibernated) wakeWebview(id);
  }
}

function deleteAccount(id) {
  accounts = accounts.filter(a => a.id !== id);
  saveAccounts();
  
  const container = document.getElementById(`container_${id}`);
  if (container) container.remove();
  
  renderAllSidebarAccounts();
  
  const isSettingsOpen = settingsView && !settingsView.classList.contains('hidden');
  const isDonationsOpen = donationsView && !donationsView.classList.contains('hidden');
  if (activeAccountId === id) {
    const enabledAccounts = accounts.filter(a => a.enabled !== false);
    if (enabledAccounts.length > 0) {
      activeAccountId = enabledAccounts[0].id;
      localStorage.setItem('whatsNexusActiveAccount', activeAccountId);
      if (!isSettingsOpen && !isDonationsOpen) {
        activateAccount(activeAccountId);
      }
    } else {
      activeAccountId = null;
      localStorage.removeItem('whatsNexusActiveAccount');
      if (!isSettingsOpen && !isDonationsOpen) {
        emptyState.classList.remove('hidden');
      }
    }
  }
  renderSettingsAccounts();
}

window.setAccountStatus = function(id, enabled) {
  const acc = accounts.find(a => a.id === id);
  if (!acc) return;
  
  acc.enabled = enabled;
  saveAccounts();
  
  if (!enabled) {
    // Al desactivar: pausar y remover webview para no consumir RAM ni recibir notificaciones
    hibernateWebview(id);
    
    if (activeAccountId === id) {
      const remaining = accounts.filter(a => a.enabled !== false);
      if (remaining.length > 0) {
        activeAccountId = remaining[0].id;
        localStorage.setItem('whatsNexusActiveAccount', activeAccountId);
      } else {
        activeAccountId = null;
        localStorage.removeItem('whatsNexusActiveAccount');
      }
    }
  } else {
    // Al activar: si no hay cuenta activa, seleccionarla
    if (!activeAccountId) {
      activeAccountId = id;
      localStorage.setItem('whatsNexusActiveAccount', id);
    }
  }

  renderAllSidebarAccounts();
  renderSettingsAccounts();
  updateTotalUnread();
};

window.toggleEditAccountName = function(id) {
  const displayEl = document.getElementById(`name_display_${id}`);
  const inputEl = document.getElementById(`name_input_${id}`);
  if (!displayEl || !inputEl) return;

  if (inputEl.classList.contains('hidden')) {
    displayEl.classList.add('hidden');
    inputEl.classList.remove('hidden');
    inputEl.focus();
    inputEl.select();
  } else {
    saveAccountName(id);
  }
};

window.saveAccountName = function(id) {
  const acc = accounts.find(a => a.id === id);
  const displayEl = document.getElementById(`name_display_${id}`);
  const inputEl = document.getElementById(`name_input_${id}`);
  if (!acc || !displayEl || !inputEl) return;

  const lang = i18n[settings.language] || i18n['en'];
  const newName = inputEl.value.trim() || lang.untitled_account || 'Cuenta sin nombre';
  acc.name = newName;
  acc.isCustomNamed = true;
  inputEl.value = newName;
  displayEl.innerText = newName;
  
  displayEl.classList.remove('hidden');
  inputEl.classList.add('hidden');
  
  saveAccounts();
  updateAccountSidebarItem(acc);
};

settingsBtn.addEventListener('click', () => {
  openSettingsView();
});

if (backToChatsBtn) {
  backToChatsBtn.addEventListener('click', () => {
    const enabledAccounts = accounts.filter(a => a.enabled !== false);
    if (activeAccountId && enabledAccounts.some(a => a.id === activeAccountId)) {
      activateAccount(activeAccountId);
    } else if (enabledAccounts.length > 0) {
      activateAccount(enabledAccounts[0].id);
    } else {
      closeSettingsView();
      emptyState.classList.remove('hidden');
    }
  });
}

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    settingsPanels.forEach(p => p.classList.remove('active'));
    
    btn.classList.add('active');
    const panel = document.getElementById(btn.dataset.tab);
    if (panel) panel.classList.add('active');
    if (btn.dataset.tab === 'tab-permissions') {
      initDownloadPathUI();
    }
    if (btn.dataset.tab === 'tab-about') {
      loadAboutInfo();
    }
  });
});

function renderSettingsAccounts() {
  settingsAccountList.innerHTML = '';
  const lang = i18n[settings.language] || i18n['en'];
  
  accounts.forEach(acc => {
    const isEnabled = acc.enabled !== false;
    const isDnd = !!acc.dnd;
    const rawAccountTitle = acc.name || lang.untitled_account || 'Cuenta sin nombre';
    const accountTitle = escapeHtml(rawAccountTitle);
    const safeId = escapeHtml(acc.id);

    const card = document.createElement('li');
    card.dataset.id = acc.id;
    
    // Si la cuenta está DESACTIVADA: tarjeta compacta mostrando solo avatar, nombre y switch de activación
    if (!isEnabled) {
      card.className = 'settings-account-card account-disabled account-compact';
      card.innerHTML = `
        <div class="account-card-header">
          <div class="account-card-identity">
            <div class="account-avatar">${getAvatarHtml(acc)}</div>
            <div class="account-name-container">
              <span class="account-name-display">${accountTitle}</span>
            </div>
          </div>
          <div class="account-card-actions" style="display: flex; align-items: center; gap: 12px;">
            <span class="account-status-badge badge-inactive">${escapeHtml(lang.status_inactive)}</span>
            <label class="switch">
              <input type="checkbox" onchange="setAccountStatus('${safeId}', this.checked)">
              <span class="switch-slider"></span>
            </label>
          </div>
        </div>
      `;
      settingsAccountList.appendChild(card);
      return;
    }

    // Cuenta ACTIVADA: Tarjeta completa con Editar, Eliminar, Estado y No Molestar
    card.className = 'settings-account-card';
    card.innerHTML = `
      <div class="account-card-header">
        <div class="account-card-identity">
          <div class="account-avatar">${getAvatarHtml(acc)}</div>
          <div class="account-name-container">
            <span class="account-name-display" id="name_display_${safeId}">${accountTitle}</span>
            <input type="text" class="account-name-input hidden" id="name_input_${safeId}" value="${accountTitle}">
          </div>
        </div>
        <div class="account-card-actions">
          <button class="btn-card-action edit-btn" onclick="toggleEditAccountName('${safeId}')">
            <span>${escapeHtml(lang.btn_edit)}</span>
          </button>
          <button class="btn-card-action delete-btn" onclick="deleteAccount('${safeId}')">
            <span>${escapeHtml(lang.btn_delete)}</span>
          </button>
        </div>
      </div>

      <!-- Fila: Estado de la cuenta -->
      <div class="account-card-row">
        <div class="account-row-info">
          <h4 class="account-row-title">${escapeHtml(lang.account_status_title)}</h4>
          <p class="account-row-desc">${escapeHtml(lang.account_status_desc)}</p>
        </div>
        <div class="account-row-control" style="display: flex; align-items: center; gap: 12px;">
          <span class="account-status-badge badge-active">${escapeHtml(lang.status_active)}</span>
          <label class="switch">
            <input type="checkbox" checked onchange="setAccountStatus('${safeId}', this.checked)">
            <span class="switch-slider"></span>
          </label>
        </div>
      </div>

      <!-- Fila: No molestar -->
      <div class="account-card-row">
        <div class="account-row-info">
          <h4 class="account-row-title">${escapeHtml(lang.dnd_title)}</h4>
          <p class="account-row-desc">${escapeHtml(lang.dnd_desc)}</p>
        </div>
        <div class="account-row-control">
          <label class="switch">
            <input type="checkbox" id="dnd_switch_${safeId}" ${isDnd ? 'checked' : ''} onchange="toggleDND('${safeId}')">
            <span class="switch-slider"></span>
          </label>
        </div>
      </div>
    `;

    const input = card.querySelector(`#name_input_${acc.id}`);
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          saveAccountName(acc.id);
        } else if (e.key === 'Escape') {
          input.value = acc.name;
          card.querySelector(`#name_display_${acc.id}`).classList.remove('hidden');
          input.classList.add('hidden');
        }
      });
      input.addEventListener('blur', () => {
        saveAccountName(acc.id);
      });
    }

    settingsAccountList.appendChild(card);
  });
}

window.toggleDND = (id) => {
  const acc = accounts.find(a => a.id === id);
  if (acc) {
    acc.dnd = !acc.dnd;
    saveAccounts();
    renderSettingsAccounts();
    updateTotalUnread();

    const wv = document.getElementById(`webview_${acc.id}`);
    if (wv) {
      try {
        wv.send('update-account-settings', { dnd: !!acc.dnd });
      } catch (_) {}
    }
  }
};

window.deleteAccount = deleteAccount;

if (themeSelect) {
  themeSelect.addEventListener('change', (e) => {
    settings.theme = e.target.value;
    saveSettings();
  });
}

if (paletteSelect) {
  paletteSelect.addEventListener('change', (e) => {
    settings.themePalette = e.target.value;
    saveSettings();
  });
}

if (trayStyleSelect) {
  trayStyleSelect.addEventListener('change', (e) => {
    settings.trayStyle = e.target.value;
    saveSettings();
  });
}

if (trayBadgeToggle) {
  trayBadgeToggle.addEventListener('change', (e) => {
    settings.trayShowBadge = e.target.checked;
    saveSettings();
  });
}

if (languageSelect) {
  languageSelect.addEventListener('change', (e) => {
    settings.language = e.target.value;
    saveSettings();
  });
}

// ========================================================
// Gestor Universal de Menús Desplegables Personalizados (M3 Expressive)
// ========================================================
const customDropdowns = {};

function initCustomDropdown(selectId) {
  const select = document.getElementById(selectId);
  const wrapper = document.getElementById(`custom-${selectId}-wrapper`);
  if (!select || !wrapper) return null;

  const trigger = wrapper.querySelector('.custom-select-trigger');
  const label = trigger ? trigger.querySelector('span') : null;
  const optionsContainer = wrapper.querySelector('.custom-select-options');
  if (!trigger || !optionsContainer || !label) return null;

  function render() {
    optionsContainer.innerHTML = '';
    const currentVal = select.value;
    Array.from(select.options).forEach(opt => {
      const item = document.createElement('div');
      item.className = 'custom-option' + (opt.value === currentVal ? ' selected' : '');
      item.innerText = opt.innerText;
      item.dataset.value = opt.value;

      item.addEventListener('click', (e) => {
        e.stopPropagation();
        select.value = opt.value;
        label.innerText = opt.innerText;
        optionsContainer.querySelectorAll('.custom-option').forEach(el => el.classList.remove('selected'));
        item.classList.add('selected');
        optionsContainer.classList.remove('open');
        trigger.classList.remove('open');
        select.dispatchEvent(new Event('change', { bubbles: true }));
      });

      optionsContainer.appendChild(item);
    });

    const selectedOpt = select.options[select.selectedIndex] || select.options[0];
    if (selectedOpt) {
      label.innerText = selectedOpt.innerText;
    }
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    // Cerrar cualquier otro dropdown abierto
    document.querySelectorAll('.custom-select-options.open').forEach(el => {
      if (el !== optionsContainer) el.classList.remove('open');
    });
    document.querySelectorAll('.custom-select-trigger.open').forEach(el => {
      if (el !== trigger) el.classList.remove('open');
    });

    const isOpen = optionsContainer.classList.contains('open');
    if (isOpen) {
      optionsContainer.classList.remove('open');
      trigger.classList.remove('open');
    } else {
      optionsContainer.classList.add('open');
      trigger.classList.add('open');
      const selected = optionsContainer.querySelector('.custom-option.selected');
      if (selected) {
        selected.scrollIntoView({ block: 'nearest' });
      }
    }
  });

  render();
  customDropdowns[selectId] = render;
  return render;
}

function refreshAllCustomDropdowns() {
  Object.values(customDropdowns).forEach(renderFn => {
    if (typeof renderFn === 'function') renderFn();
  });
}

// Inicializar todos los selectores personalizados
initCustomDropdown('palette-select');
initCustomDropdown('theme-select');
initCustomDropdown('tray-style-select');
initCustomDropdown('privacy-preset-select');

// Manejo del selector de idioma personalizado con scroll limitado a 10 elementos
const langTrigger = document.getElementById('language-select-trigger');
const langOptions = document.getElementById('language-select-options');

if (langTrigger && langOptions) {
  langTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.custom-select-options.open').forEach(el => {
      if (el !== langOptions) el.classList.remove('open');
    });
    document.querySelectorAll('.custom-select-trigger.open').forEach(el => {
      if (el !== langTrigger) el.classList.remove('open');
    });

    const isOpen = langOptions.classList.contains('open');
    if (isOpen) {
      langOptions.classList.remove('open');
      langTrigger.classList.remove('open');
    } else {
      langOptions.classList.add('open');
      langTrigger.classList.add('open');
      const selected = langOptions.querySelector('.custom-option.selected');
      if (selected) {
        selected.scrollIntoView({ block: 'nearest' });
      }
    }
  });
}

document.addEventListener('click', () => {
  document.querySelectorAll('.custom-select-options.open').forEach(el => el.classList.remove('open'));
  document.querySelectorAll('.custom-select-trigger.open').forEach(el => el.classList.remove('open'));
});

// Manejo de Plantillas de Privacidad (Amplio, Medio, Estricto, Personalizado)
if (privacyPresetSelect) {
  privacyPresetSelect.addEventListener('change', (e) => {
    const preset = e.target.value;
    settings.notifications.preset = preset;

    if (preset === 'broad') {
      settings.notifications.contactPhoto = true;
      settings.notifications.contactName = true;
      settings.notifications.messagePreview = true;
      settings.notifications.notificationSound = true;
    } else if (preset === 'medium') {
      settings.notifications.contactPhoto = true;
      settings.notifications.contactName = true;
      settings.notifications.messagePreview = false;
      settings.notifications.notificationSound = true;
    } else if (preset === 'strict') {
      settings.notifications.contactPhoto = false;
      settings.notifications.contactName = false;
      settings.notifications.messagePreview = false;
      settings.notifications.notificationSound = false;
    }
    saveSettings();
  });
}

function handleIndividualNotificationToggle() {
  settings.notifications.contactPhoto = notifPhotoToggle ? notifPhotoToggle.checked : true;
  settings.notifications.contactName = notifNameToggle ? notifNameToggle.checked : true;
  settings.notifications.messagePreview = notifPreviewToggle ? notifPreviewToggle.checked : true;
  settings.notifications.notificationSound = notifSoundToggle ? notifSoundToggle.checked : true;

  // Si el usuario mueve una de las opciones manualmente, automáticamente cambia a 'personalizado'
  settings.notifications.preset = 'custom';
  if (privacyPresetSelect) privacyPresetSelect.value = 'custom';
  saveSettings();
  if (typeof refreshAllCustomDropdowns === 'function') {
    refreshAllCustomDropdowns();
  }
}

[notifPhotoToggle, notifNameToggle, notifPreviewToggle, notifSoundToggle].forEach(toggle => {
  if (toggle) {
    toggle.addEventListener('change', handleIndividualNotificationToggle);
  }
});

if (notifDesktopToggle) {
  notifDesktopToggle.addEventListener('change', () => {
    settings.notifications.desktopNotifications = notifDesktopToggle.checked;
    saveSettings();
  });
}


// ========================================================
// Manejadores de la Pestaña Permisos
// ========================================================
function handlePermissionToggle(key, toggleEl) {
  if (toggleEl) {
    toggleEl.addEventListener('change', () => {
      settings.permissions[key] = toggleEl.checked;
      saveSettings();
    });
  }
}

handlePermissionToggle('microphone', permMicToggle);
handlePermissionToggle('camera', permCameraToggle);
handlePermissionToggle('location', permLocationToggle);
handlePermissionToggle('screenShare', permScreenToggle);
handlePermissionToggle('screenShareAudio', permScreenAudioToggle);

if (permAllowAllBtn) {
  permAllowAllBtn.addEventListener('click', () => {
    settings.permissions.microphone = true;
    settings.permissions.camera = true;
    settings.permissions.location = true;
    settings.permissions.screenShare = true;
    settings.permissions.screenShareAudio = true;
    saveSettings();
  });
}

if (permDenyAllBtn) {
  permDenyAllBtn.addEventListener('click', () => {
    settings.permissions.microphone = false;
    settings.permissions.camera = false;
    settings.permissions.location = false;
    settings.permissions.screenShare = false;
    settings.permissions.screenShareAudio = false;
    saveSettings();
  });
}

// ========================================================
// Manejadores y Funciones de la Pestaña Acerca de
// ========================================================
async function loadAboutInfo() {
  const versionEl = document.getElementById('about-app-version');
  const osEl = document.getElementById('about-spec-os');
  const archEl = document.getElementById('about-spec-arch');
  const electronEl = document.getElementById('about-spec-electron');
  const chromeEl = document.getElementById('about-spec-chromium');
  const nodeEl = document.getElementById('about-spec-node');
  const v8El = document.getElementById('about-spec-v8');

  let sysInfo = null;
  if (electronAPI && electronAPI.getSystemInfo) {
    try {
      sysInfo = await electronAPI.getSystemInfo();
    } catch (_) {}
  }

  if (!sysInfo && electronAPI && electronAPI.appInfo) {
    sysInfo = {
      version: electronAPI.appInfo.version,
      electron: electronAPI.appInfo.electronVersion,
      chrome: electronAPI.appInfo.chromeVersion,
      node: 'N/A',
      v8: 'N/A',
      osType: electronAPI.appInfo.platform,
      osRelease: '',
      osArch: electronAPI.appInfo.arch
    };
  }

  if (sysInfo) {
    if (versionEl) {
      const activeVer = sysInfo.appVersion || sysInfo.version || (electronAPI.appInfo && (electronAPI.appInfo.appVersion || electronAPI.appInfo.version));
      if (activeVer) {
        versionEl.innerText = `Versión ${activeVer}`;
      }
    }
    if (osEl) {
      const release = sysInfo.osRelease ? ` ${sysInfo.osRelease}` : '';
      osEl.innerText = `${sysInfo.osType || sysInfo.platform || 'Linux'}${release}`;
    }
    if (archEl) {
      archEl.innerText = sysInfo.osArch || sysInfo.arch || 'x64';
    }
    if (electronEl) {
      electronEl.innerText = sysInfo.electron || 'N/A';
    }
    if (chromeEl) {
      chromeEl.innerText = sysInfo.chrome || 'N/A';
    }
    if (nodeEl) {
      nodeEl.innerText = sysInfo.node || 'N/A';
    }
    if (v8El) {
      v8El.innerText = sysInfo.v8 || 'N/A';
    }
  }
}

const btnAboutRepo = document.getElementById('btn-about-repo');
const btnAboutIssues = document.getElementById('btn-about-issues');
const btnAboutZapzap = document.getElementById('btn-about-zapzap');

if (btnAboutRepo) {
  btnAboutRepo.addEventListener('click', () => {
    const repoUrl = 'https://github.com/Sentinel-Mexico/WhatsNexus-Dekstop';
    if (electronAPI && electronAPI.openExternalUrl) {
      electronAPI.openExternalUrl(repoUrl);
    } else if (electronAPI && electronAPI.openExternal) {
      electronAPI.openExternal(repoUrl);
    }
  });
}

if (btnAboutIssues) {
  btnAboutIssues.addEventListener('click', () => {
    const issuesUrl = 'https://github.com/Sentinel-Mexico/WhatsNexus-Dekstop/issues';
    if (electronAPI && electronAPI.openExternalUrl) {
      electronAPI.openExternalUrl(issuesUrl);
    } else if (electronAPI && electronAPI.openExternal) {
      electronAPI.openExternal(issuesUrl);
    }
  });
}

if (btnAboutZapzap) {
  btnAboutZapzap.addEventListener('click', () => {
    const zapzapUrl = 'https://github.com/rafatosta/zapzap';
    if (electronAPI && electronAPI.openExternalUrl) {
      electronAPI.openExternalUrl(zapzapUrl);
    } else if (electronAPI && electronAPI.openExternal) {
      electronAPI.openExternal(zapzapUrl);
    }
  });
}

const btnAboutSentinel = document.getElementById('btn-about-sentinel');
if (btnAboutSentinel) {
  btnAboutSentinel.addEventListener('click', () => {
    const sentinelUrl = 'https://somossentinel.com/studio';
    if (electronAPI && electronAPI.openExternalUrl) {
      electronAPI.openExternalUrl(sentinelUrl);
    } else if (electronAPI && electronAPI.openExternal) {
      electronAPI.openExternal(sentinelUrl);
    }
  });
}

// Control del Modal de Licencia GNU GPL v3
const gplModal = document.getElementById('gpl-license-modal');
const btnOpenGplLicense = document.getElementById('btn-open-gpl-license');
const btnCloseGplModal = document.getElementById('btn-close-gpl-modal');
const btnCloseGplModalAction = document.getElementById('btn-close-gpl-modal-action');

function openGplModal() {
  if (gplModal) {
    gplModal.classList.remove('hidden');
  }
}

function closeGplModal() {
  if (gplModal) {
    gplModal.classList.add('hidden');
  }
}

if (btnOpenGplLicense) {
  btnOpenGplLicense.addEventListener('click', (e) => {
    e.preventDefault();
    openGplModal();
  });
}

if (btnCloseGplModal) {
  btnCloseGplModal.addEventListener('click', (e) => {
    e.preventDefault();
    closeGplModal();
  });
}

if (btnCloseGplModalAction) {
  btnCloseGplModalAction.addEventListener('click', (e) => {
    e.preventDefault();
    closeGplModal();
  });
}

if (gplModal) {
  gplModal.addEventListener('click', (e) => {
    if (e.target === gplModal) {
      closeGplModal();
    }
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && gplModal && !gplModal.classList.contains('hidden')) {
    closeGplModal();
  }
});

addAccountBtn.addEventListener('click', () => addAccount());

if (reportBugBtn) {
  reportBugBtn.addEventListener('click', () => {
    const appInfo = electronAPI.appInfo || {};
    const currentVer = appInfo.appVersion || appInfo.version || '';
    const osInfo = `${appInfo.platform || ''} ${appInfo.arch || ''}`.trim() || 'N/A';
    const electronVer = appInfo.electronVersion || 'N/A';
    const chromeVer = appInfo.chromeVersion || 'N/A';
    const lang = settings.language || 'es';
    const theme = settings.theme || 'theme-dark';
    const totalAccounts = accounts.length;

    const issueTitle = encodeURIComponent('[Bug]: ');
    const issueBody = encodeURIComponent(
`### 🐛 Descripción del Problema
<!-- Explica de forma clara qué está sucediendo o qué falló -->


### 🔁 Pasos para Reproducir
1. Ir a '...'
2. Hacer clic en '...'
3. Ver el error

### ✅ Comportamiento Esperado
<!-- Qué esperabas que sucediera -->


---

### 💻 Información de Diagnóstico
- **Versión de WhatsNexus:** v${currentVer} (Beta)
- **Sistema Operativo:** ${osInfo}
- **Electron:** v${electronVer}
- **Chromium:** v${chromeVer}
- **Idioma de la App:** ${lang}
- **Tema Actual:** ${theme}
- **Cuentas Configuradas:** ${totalAccounts}
`
    );

    const url = `https://github.com/Sentinel-Mexico/WhatsNexus-Dekstop/issues/new?title=${issueTitle}&body=${issueBody}`;
    electronAPI.openExternal(url);
  });
}

// Controladores de la Vista de Donaciones
if (donateBtn) {
  donateBtn.addEventListener('click', () => {
    openDonationsView();
  });
}

if (backFromDonationsBtn) {
  backFromDonationsBtn.addEventListener('click', () => {
    if (activeAccountId) {
      activateAccount(activeAccountId);
    } else {
      closeDonationsView();
      emptyState.classList.remove('hidden');
    }
  });
}

// Enlaces seguros de Donaciones vía IPC
document.querySelectorAll('.btn-donate').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const platform = btn.dataset.platform;
    const url = DONATION_URLS[platform];
    if (url) {
      if (electronAPI.openExternalUrl) {
        electronAPI.openExternalUrl(url);
      } else if (electronAPI.openExternal) {
        electronAPI.openExternal(url);
      }
    }
  });
});


// Botones de Gestión de Descargas
if (btnSelectDownloadDir) {
  btnSelectDownloadDir.addEventListener('click', async (e) => {
    e.preventDefault();
    const selectMethod = window.electronAPI && (electronAPI.selectFolder || electronAPI.selectDownloadDirectory);
    if (selectMethod) {
      try {
        const chosen = await selectMethod();
        if (chosen) {
          settings.downloadPath = chosen;
          saveSettings();
          if (downloadPathInput) downloadPathInput.value = chosen;
        }
      } catch (err) {
        console.error('Error al seleccionar carpeta de descargas:', err);
      }
    }
  });
}

if (btnResetDownloadDir) {
  btnResetDownloadDir.addEventListener('click', async (e) => {
    e.preventDefault();
    const resetMethod = window.electronAPI && (electronAPI.resetFolder || electronAPI.resetDownloadDirectory);
    if (resetMethod) {
      try {
        const def = await resetMethod();
        if (def) {
          settings.downloadPath = def;
          saveSettings();
          if (downloadPathInput) downloadPathInput.value = def;
        }
      } catch (err) {
        console.error('Error al restablecer carpeta de descargas:', err);
      }
    }
  });
}

// Receptor IPC para ruta de descargas por defecto enviada desde el proceso principal
if (window.electronAPI && electronAPI.onDefaultDownloadsPath) {
  electronAPI.onDefaultDownloadsPath((defaultPath) => {
    if (defaultPath) {
      if (downloadPathInput && !downloadPathInput.value) {
        downloadPathInput.value = defaultPath;
      }
      if (!settings.downloadPath) {
        settings.downloadPath = defaultPath;
        saveSettings();
      }
    }
  });
}

// Detección reactiva de cambios de tema en el Sistema Operativo
if (window.electronAPI && electronAPI.onSystemThemeUpdated) {
  electronAPI.onSystemThemeUpdated((isDark) => {
    if (window.electronAPI) {
      window.electronAPI.systemIsDark = isDark;
    }
    if (settings.theme === 'theme-auto' || !settings.theme) {
      applySettings();
    }
  });
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (window.electronAPI) {
    window.electronAPI.systemIsDark = e.matches;
  }
  if (settings.theme === 'theme-auto' || !settings.theme) {
    applySettings();
  }
});

document.addEventListener('DOMContentLoaded', init);

// Enfocar cuenta al hacer click en una notificación nativa
if (electronAPI.onSelectAccount) {
  electronAPI.onSelectAccount((accountId) => {
    if (accountId) {
      activateAccount(accountId);
    }
  });
}

