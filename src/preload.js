const { ipcRenderer } = require('electron');

let lastProfilePic = null;
let observer = null;
let intervalId = null;
let attempts = 0;
const MAX_ATTEMPTS = 30; // Máximo ~5 minutos de reintentos lentos

function extractProfilePicture() {
  try {
    // En WhatsApp Web, la foto de perfil del usuario está en el header principal
    const header = document.querySelector('header');
    if (header) {
      const img = header.querySelector('img');
      if (img && img.src) {
        if (img.src !== lastProfilePic) {
          lastProfilePic = img.src;
          ipcRenderer.sendToHost('profile-picture-updated', img.src);
        }
        // OPTIMIZACIÓN CRÍTICA: Desconectar el observador para ahorrar 100% de CPU
        cleanupObservers();
        return true;
      }
    }
  } catch (error) {
    console.error('Error extrayendo foto de perfil:', error);
  }
  return false;
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
  // Intentar de inmediato
  if (extractProfilePicture()) return;

  // Monitorear con debounce/throttle para no saturar la CPU
  let debounceTimer = null;
  observer = new MutationObserver(() => {
    if (debounceTimer) return;
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      extractProfilePicture();
    }, 1500); // Evaluar como máximo cada 1.5 segundos
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Respaldo periódico espaciado a 10s con límite de intentos
  intervalId = setInterval(() => {
    attempts++;
    const found = extractProfilePicture();
    if (found || attempts >= MAX_ATTEMPTS) {
      cleanupObservers();
    }
  }, 10000);
});
