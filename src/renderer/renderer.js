const path = require('path');
// El estado de nuestras cuentas
let accounts = JSON.parse(localStorage.getItem('whatsNexusAccounts')) || [];
let activeAccountId = null;

// Settings
let settings = JSON.parse(localStorage.getItem('whatsNexusSettings')) || {
  theme: 'theme-dark',
  language: 'es',
  privacy: 'broad'
};

// Elementos del DOM
const accountList = document.getElementById('account-list');
const addAccountBtn = document.getElementById('add-account-btn');
const settingsBtn = document.getElementById('settings-btn');
const webviewContainer = document.getElementById('webview-container');
const emptyState = document.getElementById('empty-state');

// Elementos del Modal
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const tabBtns = document.querySelectorAll('.tab-btn');
const settingsPanels = document.querySelectorAll('.settings-panel');
const settingsAccountList = document.getElementById('settings-account-list');

// Selectores de Ajustes
const themeSelect = document.getElementById('theme-select');
const languageSelect = document.getElementById('language-select');
const privacyRadios = document.querySelectorAll('input[name="privacy-profile"]');

// Textos traducibles básicos
const i18n = {
  en: { welcome: "Welcome to WhatsNexus", welcome_desc: "Select an account or add a new one." },
  es: { welcome: "Bienvenido a WhatsNexus", welcome_desc: "Selecciona una cuenta en la barra lateral o añade una nueva para comenzar." },
  hi: { welcome: "WhatsNexus में आपका स्वागत है", welcome_desc: "एक खाता चुनें या नया जोड़ें।" },
  ar: { welcome: "مرحبًا بك في WhatsNexus", welcome_desc: "حدد حسابًا أو أضف حسابًا جديدًا." },
  bn: { welcome: "WhatsNexus এ স্বাগতম", welcome_desc: "একটি অ্যাকাউন্ট নির্বাচন করুন বা একটি নতুন যোগ করুন।" },
  pt: { welcome: "Bem-vindo ao WhatsNexus", welcome_desc: "Selecione uma conta ou adicione uma nova." },
  ru: { welcome: "Добро пожаловать в WhatsNexus", welcome_desc: "Выберите учетную запись или добавьте новую." },
  ur: { welcome: "WhatsNexus میں خوش آمدید", welcome_desc: "ایک اکاؤنٹ منتخب کریں یا نیا شامل کریں۔" },
  id: { welcome: "Selamat datang di WhatsNexus", welcome_desc: "Pilih akun atau tambahkan yang baru." },
  fr: { welcome: "Bienvenue sur WhatsNexus", welcome_desc: "Sélectionnez un compte ou ajoutez-en un nouveau." }
};

function init() {
  applySettings();
  
  if (accounts.length === 0) {
    addAccount('Cuenta 1');
  } else {
    // Restaurar cuentas desde localStorage
    accounts.forEach(acc => {
      renderAccountSidebarItem(acc);
      createWebview(acc);
    });
    activateAccount(accounts[0].id);
  }
}

function saveAccounts() {
  localStorage.setItem('whatsNexusAccounts', JSON.stringify(accounts));
}

function saveSettings() {
  localStorage.setItem('whatsNexusSettings', JSON.stringify(settings));
  applySettings();
}

function applySettings() {
  // Aplicar Tema
  if (settings.theme === 'theme-auto') {
    const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.className = isDark ? 'theme-dark' : 'theme-light';
  } else {
    document.body.className = settings.theme;
  }
  
  // Sincronizar selectores
  themeSelect.value = settings.theme;
  languageSelect.value = settings.language;
  document.querySelector(`input[name="privacy-profile"][value="${settings.privacy}"]`).checked = true;
  
  // Aplicar idioma
  const t = i18n[settings.language] || i18n['es'];
  document.querySelector('[data-i18n="welcome"]').innerText = t.welcome;
  document.querySelector('[data-i18n="welcome_desc"]').innerText = t.welcome_desc;
}

// Añadir cuenta
function addAccount(name = null) {
  const accountId = 'acc_' + Date.now();
  const accountName = name || `Cuenta ${accounts.length + 1}`;
  
  const account = {
    id: accountId,
    name: accountName,
    partition: `persist:${accountId}`,
    avatarUrl: null,
    dnd: false
  };
  
  accounts.push(account);
  saveAccounts();
  
  renderAccountSidebarItem(account);
  createWebview(account);
  
  if (!name) {
    activateAccount(accountId);
  }
  renderSettingsAccounts(); // Actualizar lista de ajustes si está abierta
}

function getAvatarHtml(account) {
  if (account.avatarUrl) {
    return `<img src="${account.avatarUrl}" alt="Avatar">`;
  }
  return `<i class="fa-solid fa-circle-user"></i>`;
}

function renderAccountSidebarItem(account) {
  const li = document.createElement('li');
  li.className = 'account-item tooltip-container';
  li.dataset.id = account.id;
  
  li.innerHTML = `
    <div class="account-avatar" id="avatar_${account.id}">
      ${getAvatarHtml(account)}
    </div>
    <span class="tooltip-text" id="tooltip_${account.id}">${account.name}</span>
  `;
  
  li.addEventListener('click', () => {
    activateAccount(account.id);
  });
  
  accountList.appendChild(li);
}

function updateAccountSidebarItem(account) {
  const avatarDiv = document.getElementById(`avatar_${account.id}`);
  if (avatarDiv) {
    avatarDiv.innerHTML = getAvatarHtml(account);
  }
  const tooltip = document.getElementById(`tooltip_${account.id}`);
  if (tooltip) {
    tooltip.innerText = account.name;
  }
}

function createWebview(account) {
  const webview = document.createElement('webview');
  webview.id = `webview_${account.id}`;
  webview.setAttribute('src', 'https://web.whatsapp.com/');
  webview.setAttribute('partition', account.partition);
  // CRÍTICO: Inyectar el script preload absoluto
  const preloadPath = path.join(__dirname, '..', 'preload.js');
  webview.setAttribute('preload', `file://${preloadPath}`);
  
  webview.setAttribute('useragent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  // Escuchar mensajes IPC desde el preload.js
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
    }
  });

  webviewContainer.appendChild(webview);
}

function activateAccount(id) {
  if (activeAccountId === id) return;
  
  activeAccountId = id;
  
  document.querySelectorAll('.account-item').forEach(item => {
    if (item.dataset.id === id) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
  
  document.querySelectorAll('webview').forEach(webview => {
    if (webview.id === `webview_${id}`) {
      webview.classList.add('active');
    } else {
      webview.classList.remove('active');
    }
  });
  
  if (id) {
    emptyState.classList.add('hidden');
  }
}

function deleteAccount(id) {
  accounts = accounts.filter(a => a.id !== id);
  saveAccounts();
  
  // Remover de UI
  const li = document.querySelector(`.account-item[data-id="${id}"]`);
  if (li) li.remove();
  const webview = document.getElementById(`webview_${id}`);
  if (webview) webview.remove();
  
  if (activeAccountId === id) {
    activeAccountId = null;
    if (accounts.length > 0) {
      activateAccount(accounts[0].id);
    } else {
      emptyState.classList.remove('hidden');
    }
  }
  renderSettingsAccounts();
}

// Modal y Configuración UI
settingsBtn.addEventListener('click', () => {
  renderSettingsAccounts();
  settingsModal.classList.remove('hidden');
});

closeSettingsBtn.addEventListener('click', () => {
  settingsModal.classList.add('hidden');
});

// Pestañas
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    settingsPanels.forEach(p => p.classList.remove('active'));
    
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// Renderizar Cuentas en Ajustes
function renderSettingsAccounts() {
  settingsAccountList.innerHTML = '';
  accounts.forEach(acc => {
    const li = document.createElement('li');
    li.className = 'settings-account-item';
    li.innerHTML = `
      <div class="account-avatar">${getAvatarHtml(acc)}</div>
      <div class="settings-account-info">
        <input type="text" value="${acc.name}" data-id="${acc.id}" class="account-name-input">
      </div>
      <div class="settings-account-actions">
        <button class="btn-action ${acc.dnd ? 'dnd-active' : ''}" title="No Molestar" onclick="toggleDND('${acc.id}')">
          <i class="fa-solid fa-bell${acc.dnd ? '-slash' : ''}"></i>
        </button>
        <button class="btn-action btn-danger" title="Eliminar Cuenta" onclick="deleteAccount('${acc.id}')">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `;
    
    const input = li.querySelector('.account-name-input');
    input.addEventListener('change', (e) => {
      acc.name = e.target.value;
      saveAccounts();
      updateAccountSidebarItem(acc);
    });
    
    settingsAccountList.appendChild(li);
  });
}

window.toggleDND = (id) => {
  const acc = accounts.find(a => a.id === id);
  if (acc) {
    acc.dnd = !acc.dnd;
    saveAccounts();
    renderSettingsAccounts();
  }
};

window.deleteAccount = deleteAccount;

// Eventos de Ajustes Generales
themeSelect.addEventListener('change', (e) => {
  settings.theme = e.target.value;
  saveSettings();
});

languageSelect.addEventListener('change', (e) => {
  settings.language = e.target.value;
  saveSettings();
});

privacyRadios.forEach(radio => {
  radio.addEventListener('change', (e) => {
    settings.privacy = e.target.value;
    saveSettings();
  });
});

addAccountBtn.addEventListener('click', () => addAccount());

document.addEventListener('DOMContentLoaded', init);
