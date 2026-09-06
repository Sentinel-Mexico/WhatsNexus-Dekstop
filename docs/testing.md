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
To ensure zero missing or broken translation JSON files across all 55 supported languages, run:

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
if (errors === 0) console.log('All 55 locale files parsed successfully!');
"
```

### 1.2 Modular Theme Schemas Integrity Test
To verify the structural integrity, JSON validity, and token completeness of all 16 modular themes in `src/themes/`, run:

```bash
node -e "
const fs = require('fs');
const path = require('path');
const themesDir = 'src/themes';
const files = fs.readdirSync(themesDir).filter(f => f.endsWith('.json'));
console.log('Testing', files.length, 'theme files...');
let errors = 0;
for (const file of files) {
  try {
    const theme = JSON.parse(fs.readFileSync(path.join(themesDir, file), 'utf-8'));
    if (!theme.id || !theme.nameKey || !theme.category || !theme.modes || !theme.modes.light || !theme.modes.dark) {
      console.error(file, 'is missing required schema fields (id, nameKey, category, modes.light, modes.dark)');
      errors++;
    }
  } catch (err) {
    console.error('Invalid JSON in', file, err.message);
    errors++;
  }
}
if (errors === 0) console.log('All 16 theme schemas validated successfully!');
"
```

---

## 2. Manual Functional QA Checklist

Before cutting any release candidate, run through the following test matrices:

### 2.1 Multi-Account & Session Isolation
- [ ] **Add Account**: Clicking "+" creates a new account, switches to it, and shows the QR code screen.
- [ ] **Session Isolation**: Logging into Account 1 does not affect Account 2.
- [ ] **Process Sandboxing**: Confirm Chromium renderer processes execute with `sandbox: true` enabled.
- [ ] **Deny-by-Default**: Verify unexpected hardware capability requests are rejected by default.
- [ ] **Data Persistence**: Closing and restarting the application restores logged-in sessions without re-authenticating.
- [ ] **Avatar Extraction**: Once logged in, the user avatar is extracted from WhatsApp Web and rendered in the sidebar.
- [ ] **Account Deletion**: Deleting an account removes its container and selects the next available account.

### 2.2 Memory & Hibernation
- [ ] **Hibernation Trigger**: Set `HIBERNATION_TIMEOUT = 10000` (10 seconds) for testing; confirm inactive webview is destroyed and overlay is displayed.
- [ ] **RAM Verification**: Monitor system task manager (`htop` or `ps aux`); verify memory decreases significantly after hibernation.
- [ ] **Wakeup**: Clicking "Wake Up" or selecting the tab immediately reconstructs the webview and reconnects to WhatsApp.
- [ ] **Zero Disk Avatars**: Verify notification avatar dispatch does not create temporary `avatar_notif_*.png` files in `userData`.
- [ ] **Preload Observer**: Verify the fallback `setInterval` in `src/preload.js` terminates once the `MutationObserver` triggers.

### 2.3 Full-Window Settings View & Appearance
- [ ] **Opening Settings**: Clicking the settings gear in the sidebar opens the settings dashboard across 100% of the content area.
- [ ] **Sidebar Active Indicator**: Confirm the settings icon shows the active vertical indicator and accounts are deselected.
- [ ] **Internal Tabs**: Switching between Accounts, Appearance, Personalización, Notifications, Permissions, Privacy & Network, and About displays the correct settings cards.
- [ ] **Palette Catalog**: Cycle through all 16 palettes across 4 tiers (Alto Contraste, Bosque, Cyber-Nexus, Doom, Dracula, Messenger, Nord, Retro, Signal, Star Trek, Star Wars, Steampunk, Telegram, Vóxel, WhatsApp, WhatsNexus) across both Dark and Light variants.
- [ ] **Category Separators**: Verify theme dropdown displays clean uppercase headers without raw hyphens (`text-transform: uppercase`).
- [ ] **Conlang Fonts**: Select Elvish Tengwar and Klingon; confirm custom fonts (Tengwar Telcontar and Klingon pIqaD) render native glyphs correctly.
- [ ] **Return to Chat**: Clicking "Back to chats" or selecting an account in the sidebar hides settings and restores the chat session.

### 2.4 Theme Customization Studio ("Personalización")
- [ ] **Access Studio**: Click "Personalización" in Settings navigation; verify the theme studio card is rendered with all color token groups.
- [ ] **Dual-Mode Editing**: Toggle between Light and Dark mode segmented controls; confirm inputs switch cleanly to the corresponding mode values.
- [ ] **Token Groups**: Verify all 3 visual groups are present: *Fondos y Superficies* (5 tokens), *Tipografía y Bordes* (4 tokens), and *Acentos y Colores de Acción* (5 tokens).
- [ ] **Bidirectional Input Sync**: Pick a color using the HTML5 color swatch; verify the uppercase `#RRGGBB` input updates simultaneously, and vice-versa.
- [ ] **Real-Time Live Feedback**: Verify that editing any token instantly modifies the corresponding CSS variable on `:root` and `document.body.style` without reloading.
- [ ] **Palette Auto-Switch**: Confirm that changing any color automatically sets the active theme selector to "Personalizado".
- [ ] **One-Click Reset**: Click "Restablecer a valores de WhatsNexus"; confirm custom tokens revert back to standard WhatsNexus values.
- [ ] **State Persistence**: Restart the app; verify custom token overrides in `localStorage` (`settings.customTheme`) are preserved and applied on launch.

### 2.5 Offline Protection & Network Reconnection
- [ ] **Startup Offline**: Launch with network disconnected; verify account displays offline overlay with retry action.
- [ ] **Mid-Session Disconnect**: Disconnect network while using chats; confirm high z-index `#reconnecting-modal` appears and blocks input.
- [ ] **Auto-Reconnect**: Reconnect network; verify modal auto-dismisses and reloads accounts.

### 2.6 Auto-Updater (OTA) & External Navigation
- [ ] **Check for Updates**: Navigate to Settings ➔ About; click `#btn-update` and confirm state changes to "Checking...".
- [ ] **Up-to-Date State**: Verify button transitions to "You have the latest version" and resets to idle.
- [ ] **Safe URL Navigation**: Verify external links open in OS browser; confirm local addresses (`localhost`, `127.0.0.1`) and embedded credentials are blocked.

### 2.7 Freedoom Easter Egg
- [ ] **Activation**: Enable "Doomizate" in Settings ➔ About; verify skull icon appears in sidebar.
- [ ] **Execution**: Click skull icon; confirm Chocolate Doom boots with Freedoom: Phase 1 audio and controls overlay.
- [ ] **Controls Overlay**: Toggle chevron button to collapse and expand the overlay.

### 2.8 Platform Compatibility & Branding
- [ ] **Cross-Platform Icons**: Confirm the 512x512 application icon renders cleanly on the Splash Screen and Main Window across Linux, Windows, and macOS taskbars/docks.
- [ ] **Windows AppUserModelId**: Verify that running the application registers under `com.sentinelstudio.whatsnexus`, preventing ungrouped Electron instances.
- [ ] **macOS Dock Icon**: Verify dynamic dock icon assignment via `app.dock.setIcon` at runtime.
- [ ] **Linux (Wayland)**: Verify that launching with `--ozone-platform=wayland` runs smoothly without `wayland_wp_color_manager` errors.
- [ ] **Linux (X11 / XWayland)**: Verify standard desktop window rendering.
