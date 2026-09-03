const { ipcRenderer } = require('electron');

let lastProfilePic = null;

function extractProfilePicture() {
  try {
    // En WhatsApp Web, la foto de perfil del usuario suele estar en el header principal
    // (el panel izquierdo). Buscamos la primera imagen dentro de un header.
    const header = document.querySelector('header');
    if (header) {
      const img = header.querySelector('img');
      if (img && img.src) {
        if (img.src !== lastProfilePic) {
          lastProfilePic = img.src;
          // sendToHost envía el mensaje al <webview> en el proceso de renderizado
          ipcRenderer.sendToHost('profile-picture-updated', img.src);
        }
        return true;
      }
    }
  } catch (error) {
    console.error('Error extrayendo foto de perfil:', error);
  }
  return false;
}

window.addEventListener('load', () => {
  // Monitorear cambios en el DOM para cuando termine de cargar WhatsApp
  const observer = new MutationObserver(() => {
    extractProfilePicture();
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Respaldo: verificar periódicamente (útil si el DOM cambia o tarda en cargar)
  setInterval(extractProfilePicture, 5000);
});
