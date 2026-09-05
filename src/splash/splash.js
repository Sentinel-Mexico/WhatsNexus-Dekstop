document.addEventListener('DOMContentLoaded', () => {
  const statusText = document.getElementById('status-text');
  const percentageText = document.getElementById('percentage-text');
  const progressFill = document.getElementById('progress-fill');
  const versionBadge = document.getElementById('version-badge');

  // Query dynamic application version from main process via preload API
  try {
    const currentVersion = window.splashAPI && window.splashAPI.getAppVersion
      ? window.splashAPI.getAppVersion()
      : null;

    if (currentVersion && versionBadge) {
      versionBadge.textContent = `v${currentVersion}`;
    }
  } catch (e) {
    console.error('Failed to load version in splash:', e);
  }

  const steps = [
    { threshold: 0, text: 'Checking environment & system resources...' },
    { threshold: 25, text: 'Loading session partitions & local caches...' },
    { threshold: 55, text: 'Initializing WhatsApp Web sandbox...' },
    { threshold: 85, text: 'Launching WhatsNexus...' }
  ];

  const durationMs = 4800; // ~4.8 seconds to smoothly fill before the 5000ms transition
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
        if (window.splashAPI && window.splashAPI.finishSplash) {
          window.splashAPI.finishSplash();
        }
      }, 150);
    }
  }

  requestAnimationFrame(updateProgress);
});
