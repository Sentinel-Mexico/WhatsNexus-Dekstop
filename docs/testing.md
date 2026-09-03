# Testing & Quality Assurance Guide

## 1. Automated Syntax & Parse Testing

Because WhatsNexus utilizes native Node.js and modern ES modules in the renderer without heavy build transpilations, syntax integrity can be verified instantaneously using the Node.js V8 compiler check:

```bash
# Verify all primary JavaScript files
node -c src/main.js
node -c src/renderer/renderer.js
node -c src/preload.js
```

### 1.1 Internationalization (i18n) Key Consistency Test
To ensure zero missing translation keys across all 10 supported languages, run the following verification snippet:

```bash
node -e "
const fs = require('fs');
const html = fs.readFileSync('src/renderer/index.html', 'utf-8');
const js = fs.readFileSync('src/renderer/renderer.js', 'utf-8');
const i18n = eval('(' + js.split('const i18n = ')[1].split('function populateLanguageSelect')[0].trim().replace(/;$/, '') + ')');
const matches = [...html.matchAll(/data-i18n=[\"']([^\"']+)[\"']/g)].map(m => m[1]);
const uniqueKeys = [...new Set(matches)];
const supportedLangs = ['en', 'es', 'hi', 'ar', 'bn', 'pt', 'ru', 'ur', 'id', 'fr'];
let failed = false;
for (const lang of supportedLangs) {
  const missing = uniqueKeys.filter(k => !i18n[lang] || !i18n[lang][k]);
  if (missing.length > 0) {
    console.error('Missing in', lang, missing);
    failed = true;
  }
}
if (!failed) console.log('All i18n translation keys are 100% verified!');
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

### 2.4 Platform Compatibility
- [ ] **Linux (Wayland)**: Verify that launching with `--ozone-platform=wayland` runs smoothly without `wayland_wp_color_manager` errors.
- [ ] **Linux (X11 / XWayland)**: Verify standard desktop window rendering.
- [ ] **Windows**: Test system tray minimize and notification popup formatting.
