# Application Architecture

## 1. Architectural Overview

**WhatsNexus** is structured around the multi-process model of **Electron.js**, separating system-level window management from user interface rendering and sandboxed WhatsApp Web guest environments.

```text
                               +-----------------------------+
                               |     Electron Main Process   |
                               |        (src/main.js)        |
                               +--------------+--------------+
                                              |
                   +--------------------------+--------------------------+
                   | (IPC: splash-finished)                              |
                   v                                                     v
      +------------------------+                           +------------------------+
      |      Splash Window     |                           |       Main Window      |
      | (src/splash/splash.*)  |                           | (src/renderer/index.*) |
      +------------------------+                           +-----------+------------+
                                                                       |
                                                +----------------------+----------------------+
                                                |                      |                      |
                                                v                      v                      v
                                         +--------------+       +--------------+       +--------------+
                                         |  <webview> 1 |       |  <webview> 2 |       | #settings-view
                                         | (Session A)  |       | (Session B)  |       | (Full-window)|
                                         +-------+------+       +-------+------+       +--------------+
                                                 |                      |
                                                 v                      v
                                         +--------------+       +--------------+
                                         |  Preload JS  |       |  Preload JS  |
                                         | (DOM Observers|      | (DOM Observers|
                                         +--------------+       +--------------+
```

---

## 2. Process Responsibilities

### 2.1 Main Process (`src/main.js`)
The main process acts as the supervisor for the entire operating system interface:
- **Chromium Engine Flags:** Sets early command-line optimization switches prior to process creation (disabling telemetry, enforcing low-end memory footprints, and suppressing Wayland color negotiation issues).
- **Single Instance Enforcement:** Utilizes `app.requestSingleInstanceLock()` to prevent duplicate instances; subsequent execution attempts automatically refocus the existing primary window.
- **Window Lifecycle & Stacer-Inspired Splash Pipeline:**
  1. Instantiates a transparent, frameless splash window with an emerald loading animation.
  2. Concurrently instantiates the main application window with `{ show: false }` to pre-warm the DOM, load local stylesheets, and initialize local account metadata in the background.
  3. Listens for the `splash-finished` IPC event from the splash renderer, subsequently displaying and focusing the main window while destroying the splash window.
- **Tray Management & Minimize-to-Tray Lifecycle:**
  - Instantiates a persistent system tray icon with an SVG vector emblem rendered dynamically via `nativeImage`.
  - Intercepts window `close` events, redirecting them to `mainWindow.hide()` so that WhatsNexus remains running in the background without losing session state or missing incoming messages.
  - Dynamically synthesizes unread notification count badges directly on the tray icon when messages arrive on non-muted, active accounts.
  - Exposes context menu actions ("Mostrar WhatsNexus", "Salir") and toggles visibility upon tray icon clicks.
  - Responds to `update-tray-badge` and `update-tray-settings` IPC events from the renderer.

### 2.2 Main Renderer (`src/renderer/`)
The primary UI layer consists of vanilla HTML5, CSS3, and modern JavaScript:
- **Sidebar Controller:** Manages the active visual state between accounts, the Add Account modal/action, Bug Report dispatcher, and the Settings view.
- **Full-Window Workspace:** Houses WhatsApp Web guest containers, an `#empty-state` placeholder, and `#settings-view`.
- **Session Manager:** Manages account metadata persistence in `localStorage`, orchestrates dynamic creation/removal of `<webview>` elements, and executes the 20-minute idle hibernation cycle.
- **Internationalization (i18n):** Translates the complete interface dynamically across 10 global languages based on system locale or user override.

### 2.3 Guest Preload Script (`src/preload.js`)
Injected directly into each WhatsApp Web `<webview>` tag:
- **Profile Avatar Extraction:** Monitors WhatsApp Web DOM to retrieve the user's active profile picture (filtering out Meta AI icons/buttons) and passes it back to the host via `ipcRenderer.sendToHost('profile-picture-updated', avatarUrl)`.
- **Notification Privacy & DND Interception:** Wraps the native `window.Notification` API inside the guest page to enforce granular user privacy preferences (contact photo, name, preview, sound), account-specific Do Not Disturb (DND) silencing, and dynamic circular avatar clipping.
- **Theme Synchronization:** Intercepts `window.matchMedia('(prefers-color-scheme: dark)')` and DOM classes to seamlessly synchronize WhatsApp Web's dark/light interface with WhatsNexus's active visual theme.
- **Title Observer:** Watches WhatsApp Web title mutations to detect unread message badges `(n) WhatsApp`.

---

## 3. View Management & Navigation Model

Instead of relying on pop-up dialogs or modal windows that obstruct the interface, WhatsNexus uses a unified, full-window single-page navigation model inside `<main class="main-content">`:

1. **WhatsApp Account Views (`.account-container`):**
   - Each active WhatsApp account has an isolated DOM container containing its respective `<webview>`.
   - Switching accounts in the sidebar hides non-active containers via `.hidden` without reloading the page, preserving scroll positions and in-progress chat input.
2. **Dedicated Settings View (`#settings-view`):**
   - Treated as an internal full-window view that occupies 100% width and height of the main content workspace.
   - Triggered by `#settings-btn` in the sidebar, which assumes an `.active` tab state.
   - Provides a "Back to chats" action in the header to return to the last active WhatsApp session.
3. **Empty State View (`#empty-state`):**
   - Displayed automatically when zero accounts exist or all accounts have been removed.

---

## 4. Global Configuration Model (Universal Settings Enforcement)

All preferences defined in the Settings panels (**Apariencia**, **Notificaciones**, and **Permisos**) operate under a **Global Enforcement Architecture**:

1. **Universal Scope:** Configuration parameters are global application policies stored in `settings` (`localStorage`) and mirrored to the Electron main process via IPC.
2. **Present Accounts:** Modifications made in Settings are reactively broadcast to all active `<webview>` instances, Chromium sessions, and audio outputs in real time (e.g., dynamic audio muting, dark/light guest classes, and notification filters).
3. **Future Accounts:** Whenever a new account is registered (`addAccount`) or awakened from hibernation (`wakeWebview`), its newly created `<webview>` and isolated partition (`persist:acc_*`) automatically inherit the full global settings schema upon instantiation, guaranteeing absolute behavioral consistency across all profiles without requiring manual per-account setup.
