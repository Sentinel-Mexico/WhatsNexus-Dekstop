const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
  const statusText = document.getElementById('status-text');
  const percentageText = document.getElementById('percentage-text');
  const progressFill = document.getElementById('progress-fill');
  const versionBadge = document.getElementById('version-badge');

  // Query version from main if available
  try {
    const pkg = require('../package.json');
    if (pkg && pkg.version && versionBadge) {
      versionBadge.textContent = `v${pkg.version}`;
    }
  } catch (e) {
    // Keep default
  }

  const steps = [
    { threshold: 0, text: 'Checking environment & system resources...' },
    { threshold: 25, text: 'Loading session partitions & local caches...' },
    { threshold: 55, text: 'Initializing WhatsApp Web sandbox...' },
    { threshold: 85, text: 'Launching WhatsNexus...' }
  ];

  const durationMs = 1800; // ~1.8 seconds
  const startTime = performance.now();

  function updateProgress() {
    const now = performance.now();
    const elapsed = now - startTime;
    const progress = Math.min(100, Math.round((elapsed / durationMs) * 100));

    // Update fill width and percentage text
    progressFill.style.width = `${progress}%`;
    percentageText.textContent = `${progress}%`;

    // Determine current status message
    for (let i = steps.length - 1; i >= 0; i--) {
      if (progress >= steps[i].threshold) {
        if (statusText.textContent !== steps[i].text) {
          statusText.textContent = steps[i].text;
        }
        break;
      }
    }

    if (progress < 100) {
      requestAnimationFrame(updateProgress);
    } else {
      // Completed, give a 150ms grace period for visual feedback then signal main process
      setTimeout(() => {
        ipcRenderer.send('splash-finished');
      }, 150);
    }
  }

  requestAnimationFrame(updateProgress);
});
