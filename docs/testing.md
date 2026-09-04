# Testing & Quality Assurance Guide

## 1. Automated Syntax & Parse Testing

Because WhatsNexus utilizes native Node.js and modern ES modules in the renderer without heavy build transpilations, syntax integrity can be verified instantaneously using the Node.js V8 compiler check:

```bash
# Verify all primary JavaScript files
node -c src/main.js
node -c src/preload-main.js
node -c src/renderer/renderer.js
node -c src/preload.js
node -c scripts/download-doom.js
```

### 1.1 Internationalization (i18n) Consistency Test
To ensure zero missing or broken translation JSON files across all 26 supported languages, run:

```bash
node -e "
const fs = require('fs');
const path = require('path');
const localesDir = 'src/locales';
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));
console.log('Testing', files.length, 'locale files...');
const en = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf-8'));
const enKeys = Object.keys(en);
let errors = 0;
for (const file of files) {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(localesDir, file), 'utf-8'));
    const missing = enKeys.filter(k => data[k] === undefined);
    if (missing.length > 0) {
      console.warn(file, 'missing', missing.length, 'keys');
    }
  } catch (err) {
    console.error('Invalid JSON in', file, err.message);
    errors++;
  }
}
if (errors === 0) console.log('All 26 locale files parsed successfully!');
"
```

---

## 2. Manual Functional QA Checklist

Before cutting any release candidate, run through the following test matrices:

### 2.1 Multi-Account & Session Isolation
- [ ] **Add Account**: Clicking "+" creates a new account, switches to it, and shows the QR code screen.
- [ ] **Session Isolation**: Logging into Account 1 does not affect Account 2.
- [ ] **Data Persistence**: Closing and restarting the application restores logged-in sessions without re-authenticating.
- [ ] **Avatar Extraction**: Once logged in, the user avatar is extracted from WhatsApp Web and rendered in the sidebar.
- [ ] **Account Deletion**: Deleting an account removes its container and selects the next available account.

### 2.2 Memory & Hibernation
- [ ] **Hibernation Trigger**: Set `HIBERNATION_TIMEOUT = 10000` (10 seconds) for testing; confirm inactive webview is destroyed and overlay is displayed.
- [ ] **RAM Verification**: Monitor system task manager (`htop` or `ps aux`); verify memory decreases significantly after hibernation.
- [ ] **Wakeup**: Clicking "Wake Up" or selecting the tab immediately reconstructs the webview and reconnects to WhatsApp.

### 2.3 Full-Window Settings View
- [ ] **Opening Settings**: Clicking the settings gear in the sidebar opens the settings dashboard across 100% of the content area.
- [ ] **Sidebar Active Indicator**: Confirm the settings icon shows the active vertical indicator and accounts are deselected.
- [ ] **Internal Tabs**: Switching between Accounts, Appearance, and Notifications displays the correct settings cards.
- [ ] **Return to Chat**: Clicking "Back to chats" or selecting an account in the sidebar hides settings and restores the chat session.
- [ ] **Theme Switching**: Changing from Dark to Light or Auto updates CSS theme variables immediately.

### 2.4 Offline Protection & Network Reconnection
- [ ] **Startup Offline**: Launch with network disconnected; verify account displays offline overlay with retry action.
- [ ] **Mid-Session Disconnect**: Disconnect network while using chats; confirm high z-index `#reconnecting-modal` appears and blocks input.
- [ ] **Auto-Reconnect**: Reconnect network; verify modal auto-dismisses and reloads accounts.

### 2.5 Auto-Updater (OTA)
- [ ] **Check for Updates**: Navigate to Settings ➔ About; click `#btn-update` and confirm state changes to "Checking...".
- [ ] **Up-to-Date State**: Verify button transitions to "You have the latest version" and resets to idle.

### 2.6 Classic Doom Easter Egg
- [ ] **Activation**: Enable "Doomizate" in Settings ➔ About; verify skull icon appears in sidebar.
- [ ] **Execution**: Click skull icon; confirm Chocolate Doom boots with audio and controls overlay.
- [ ] **Controls Overlay**: Toggle chevron button to collapse and expand the overlay.

### 2.7 Platform Compatibility
- [ ] **Linux (Wayland)**: Verify that launching with `--ozone-platform=wayland` runs smoothly without `wayland_wp_color_manager` errors.
- [ ] **Linux (X11 / XWayland)**: Verify standard desktop window rendering.
- [ ] **Windows**: Test system tray minimize and notification popup formatting.
- [ ] **macOS**: Test DMG application bundle and dock integration.
