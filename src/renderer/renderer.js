// El estado de nuestras cuentas
let accounts = [];
let activeAccountId = null;

// Elementos del DOM
const accountList = document.getElementById('account-list');
const addAccountBtn = document.getElementById('add-account-btn');
const webviewContainer = document.getElementById('webview-container');
const emptyState = document.getElementById('empty-state');

// Inicializar la aplicación con dos cuentas por defecto
function init() {
  addAccount('Cuenta Personal');
  addAccount('Cuenta Trabajo');
  
  // Activar la primera cuenta por defecto
  if (accounts.length > 0) {
    activateAccount(accounts[0].id);
  }
}

// Función para añadir una nueva cuenta
function addAccount(name = null) {
  const accountId = 'acc_' + Date.now();
  const accountName = name || `Cuenta ${accounts.length + 1}`;
  
  const account = {
    id: accountId,
    name: accountName,
    partition: `persist:${accountId}` // CRÍTICO: Aquí ocurre el aislamiento de sesión
  };
  
  accounts.push(account);
  
  // 1. Crear el elemento en la barra lateral
  renderAccountSidebarItem(account);
  
  // 2. Crear el webview correspondiente en el contenedor principal
  createWebview(account);
  
  // Si no se proporcionó un nombre (es decir, el usuario hizo click en "Añadir"), la activamos inmediatamente
  if (!name) {
    activateAccount(accountId);
  }
}

// Renderiza un item de cuenta en el sidebar
function renderAccountSidebarItem(account) {
  const li = document.createElement('li');
  li.className = 'account-item';
  li.dataset.id = account.id;
  
  // Inicial de la cuenta para el avatar
  const initial = account.name.charAt(0).toUpperCase();
  
  li.innerHTML = `
    <div class="account-avatar">${initial}</div>
    <span class="account-name">${account.name}</span>
  `;
  
  li.addEventListener('click', () => {
    activateAccount(account.id);
  });
  
  accountList.appendChild(li);
}

// Crea la etiqueta <webview> para cargar WhatsApp
function createWebview(account) {
  const webview = document.createElement('webview');
  webview.id = `webview_${account.id}`;
  // Establecemos el atributo src a WhatsApp Web
  webview.setAttribute('src', 'https://web.whatsapp.com/');
  // CRÍTICO: Establecemos la partición persistente para aislar la sesión
  webview.setAttribute('partition', account.partition);
  
  // Opcional: Inyectar un User-Agent para asegurar que WhatsApp cargue correctamente
  webview.setAttribute('useragent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  webviewContainer.appendChild(webview);
}

// Cambia entre las cuentas activas
function activateAccount(id) {
  if (activeAccountId === id) return;
  
  activeAccountId = id;
  
  // 1. Actualizar estilos del sidebar
  document.querySelectorAll('.account-item').forEach(item => {
    if (item.dataset.id === id) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
  
  // 2. Mostrar/Ocultar webviews
  document.querySelectorAll('webview').forEach(webview => {
    if (webview.id === `webview_${id}`) {
      webview.classList.add('active');
    } else {
      webview.classList.remove('active');
    }
  });
  
  // Ocultar el estado vacío si hay una cuenta seleccionada
  if (id) {
    emptyState.classList.add('hidden');
  }
}

// Event Listeners
addAccountBtn.addEventListener('click', () => {
  addAccount();
});

// Inicializar la app al cargar
document.addEventListener('DOMContentLoaded', init);
