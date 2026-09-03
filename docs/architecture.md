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
- **Chromium Engine Flags & Security Hardening:** Sets early command-line optimization switches prior to process creation while preserving modern site isolation and IPC flooding safeguards. Enforces strict `contextIsolation: true` and `nodeIntegration: false` across all windows.
- **Single Instance Enforcement:** Utilizes `app.requestSingleInstanceLock()` to prevent duplicate instances; subsequent execution attempts automatically refocus the existing primary window.
- **Hardware Permissions Management:** Controls hardware capability delegation across the default session and all partitioned guest sessions (`session.setPermissionRequestHandler` and `session.setPermissionCheckHandler`), enforcing persistent user rules (`userData/permissions.json`) for Microphone, Camera, Location, and Screen Sharing (with audio validation).
- **Window Lifecycle & Stacer-Inspired Splash Pipeline:**
  1. Instantiates a transparent, frameless splash window loading `src/splash/splash.html` via `src/splash/splash-preload.js`.
  2. Concurrently instantiates the main application window with `{ show: false }` pre-warming the DOM via `src/preload-main.js`.
  3. Listens for the `splash-finished` IPC event from the splash renderer, subsequently displaying and focusing the main window while destroying the splash window.
- **Tray Management & Minimize-to-Tray Lifecycle:**
  - Instantiates a persistent system tray icon with an SVG vector emblem rendered dynamically via `nativeImage`.
  - Intercepts window `close` events, redirecting them to `mainWindow.hide()` so that WhatsNexus remains running in the background without losing session state or missing incoming messages.
  - Dynamically synthesizes unread notification count badges directly on the tray icon when messages arrive on non-muted, active accounts.
  - Exposes context menu actions ("Mostrar WhatsNexus", "Salir") and toggles visibility upon tray icon clicks.
  - Responds to `update-tray-badge` and `update-tray-settings` IPC events from the renderer.
- **Safe External Link Dispatch:** Handles `open-external` and `open-external-url` IPC invocations with strict protocol validation ensuring links only open via standard `http:` and `https:` schemes in the external default OS browser.
- **System Downloads Management:** Intercepts `will-download` events on the default session and partitioned sessions (`persist:acc_*`), applying `item.setSavePath()` to automatically route incoming file downloads to the user-specified directory (or default `app.getPath('downloads')`).
- **Native Chromium Spellchecking:** Manages multi-session spellchecking across all active and dynamically created guest sessions via `session.setSpellCheckerLanguages()`, mapping interface language codes to Chromium `.bdic` dictionaries locally.
- **Multi-Session Proxy Engine & Strict Isolation:** Dynamically provisions HTTP/SOCKS5 proxy rules or system proxy discovery across `session.defaultSession` and all partitioned sessions (`persist:acc_*`) via `session.setProxy()`. When Strict Proxy Isolation is enabled, local bypass rules are removed (`proxyBypassRules: ''`) to ensure no direct network connections evade the tunnel. Reverts to direct connections on demand (`{ mode: 'direct' }`).
- **WebRTC IP Leak Mitigation:** Enforces `session.setWebRTCIPHandlingPolicy('disable-non-proxied-udp')` at the Chromium networking layer across all sessions when WebRTC protection is enabled, preventing local and public IP disclosures over non-proxied UDP.
- **Real-Time System Diagnostics & Engine Introspection:** Exposes dynamic runtime parameters via IPC (`get-system-info`), sourcing live metrics directly from `app.getVersion()`, `process.versions` (Electron, Chromium, Node.js, V8), and Node's native `os` module (`os.type()`, `os.release()`, `os.arch()`).

### 2.2 Secure Preloads (`src/preload-main.js` & `src/splash/splash-preload.js`)
- **Main Preload (`src/preload-main.js`):** Securely bridges IPC channels, platform diagnostics, webview preload paths, native notification dispatchers, download folder selectors, spellchecker configuration, network/proxy/WebRTC settings, system info introspection (`getSystemInfo`), and external browser link dispatchers to `window.electronAPI` via `contextBridge.exposeInMainWorld()`.
- **Splash Preload (`src/splash/splash-preload.js`):** Exposes `window.splashAPI` for querying SemVer application versions and signaling transition completion.

### 2.3 Main Renderer (`src/renderer/`)
The primary UI layer consists of vanilla HTML5, CSS3, and modern JavaScript:
- **Sidebar Controller:** Manages the active visual state between accounts, Add Account modal/action, Bug Report dispatcher, Donations view (`#donate-btn`), and Settings view with a unified, floating tooltip system aligned 8px from the sidebar.
- **Full-Window Workspace:** Houses WhatsApp Web guest containers, an `#empty-state` placeholder, `#settings-view`, and `#donations-view`.
- **Donations Module:** Renders a responsive CSS grid of support platforms (GitHub Sponsors, PayPal, Ko-fi) with external navigation safeguards powered by safe IPC invokes (`openExternalUrl`).
- **Session Manager:** Manages account metadata persistence in `localStorage`, orchestrates dynamic creation/removal of `<webview>` elements, and executes the 20-minute idle hibernation cycle.
- **Zero-Mute Multimedia Audio Pipeline:** Dispatches notification preferences without ever muting `webContents`, ensuring voice notes and chat videos play continuously.
- **Internationalization (i18n):** Translates the complete interface dynamically across 25 global languages based on system locale or user override.

### 2.4 Guest Preload Script (`src/preload.js`)
Injected directly into each WhatsApp Web `<webview>` tag:
- **Profile Avatar Extraction:** Monitors WhatsApp Web DOM to retrieve the user's active profile picture (filtering out Meta AI icons/buttons) and passes it back to the host via `ipcRenderer.sendToHost('profile-picture-updated', avatarUrl)`.
- **Notification Privacy & DND Interception:** Wraps the native `window.Notification` and `ServiceWorkerRegistration.prototype.showNotification` APIs inside the guest page to enforce privacy presets ("Nombre oculto", "Mensaje oculto", branding fallback), account-specific Do Not Disturb (DND) full suppression, and dynamic circular avatar clipping.
- **Selective Audio Alert Suppression:** Intercepts `HTMLAudioElement.prototype.play` to silence automated alert chimes when DND is active or notification sound is disabled, while permitting user-initiated chat media and voice notes to play seamlessly.
- **WebRTC JavaScript API Shielding:** When WebRTC protection is active, overrides `window.RTCPeerConnection`, `window.webkitRTCPeerConnection`, `window.RTCSessionDescription`, and `window.RTCIceCandidate` with throwing stubs within the guest execution context, preventing page scripts from initiating unauthorized peer-to-peer handshakes or STUN/TURN queries.
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
3. **Dedicated Donations View (`#donations-view`):**
   - Full-window view triggered by `#donate-btn` in the sidebar, positioned strictly between Bug Report and Settings.
   - Houses a card grid of project sponsorship channels with direct OS browser dispatching.
   - Includes a back navigation button returning to active chats.
4. **Empty State View (`#empty-state`):**
   - Displayed automatically when zero accounts exist or all accounts have been removed.

---

## 4. Global Configuration Model (Universal Settings Enforcement)

All preferences defined in the Settings panels (**Apariencia**, **Notificaciones**, **Permisos**, **Privacidad y Red**, and **Acerca de**) operate under a **Global Enforcement Architecture**:

1. **Universal Scope:** Configuration parameters are global application policies stored in `settings` (`localStorage`) and mirrored to the Electron main process via IPC (`permissions.json`, `system_settings.json`, and `network_settings.json`).
2. **Present Accounts:** Modifications made in Settings are reactively broadcast to all active `<webview>` instances, Chromium sessions, download interceptors, spellcheckers, network proxy tunnels, and audio outputs in real time.
3. **Future Accounts:** Whenever a new account is registered (`addAccount`) or awakened from hibernation (`wakeWebview`), its newly created `<webview>` and isolated partition (`persist:acc_*`) automatically inherit the full global settings schema upon instantiation, guaranteeing absolute behavioral consistency across all profiles without requiring manual per-account setup.
