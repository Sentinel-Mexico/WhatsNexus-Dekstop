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
- **Chromium Engine Flags & Security Hardening:** Sets early command-line optimization switches prior to process creation while preserving modern site isolation and IPC flooding safeguards. Enforces strict `contextIsolation: true`, `nodeIntegration: false`, and full process sandboxing (`sandbox: true`) across all application windows.
- **Single Instance Enforcement:** Utilizes `app.requestSingleInstanceLock()` to prevent duplicate instances; subsequent execution attempts automatically refocus the existing primary window.
- **Hardware Permissions Management (Deny-by-Default):** Controls hardware capability delegation across the default session and all partitioned guest sessions (`session.setPermissionRequestHandler` and `session.setPermissionCheckHandler`) under a strict **Deny-by-Default** security posture, permitting only explicitly user-granted permissions (`userData/permissions.json`) for Microphone, Camera, Location, and Screen Sharing, while rejecting unexpected or unhandled permission requests by default.
- **Window Lifecycle & Strictly Timed 5-Second Splash Pipeline:**
  1. Instantiates and immediately displays a transparent, frameless splash window loading `src/splash/splash.html` via `src/splash/splash-preload.js` upon `app.whenReady()`.
  2. Concurrently instantiates the main application window in the background with `{ show: false }`, pre-warming the DOM via `src/preload-main.js`.
  3. Enforces a strict 5000ms (`setTimeout`) timer that simultaneously destroys the splash window and reveals/focuses `mainWindow`, matching the 4.8s progress animation in `src/splash/splash.js`.
- **Account Data & Session Cache Management:**
  - Persists accounts configuration securely in `app.getPath('userData')/accounts.json` via dedicated IPC handlers (`get-accounts`, `save-accounts`, `delete-account-data`), ensuring reliable execution inside packaged `app.asar` environments.
  - Implements the `clear-account-cache` IPC channel executing `ses.clearCache()` and selective `ses.clearStorageData()`, purging corrupted network caches and service workers while preserving session credentials (cookies and IndexedDB).
- **Tray Management & Minimize-to-Tray Lifecycle:**
  - Instantiates a persistent system tray icon with an SVG vector emblem rendered dynamically via `nativeImage`.
  - Intercepts window `close` events, redirecting them to `mainWindow.hide()` so that WhatsNexus remains running in the background without losing session state or missing incoming messages.
  - Dynamically synthesizes unread notification count badges directly on the tray icon when messages arrive on non-muted, active accounts.
  - Dispatches native OS notifications with in-memory circular avatar rendering via `nativeImage.createFromDataURL`, completely eliminating temporary file writes to disk.
  - Exposes context menu actions ("Mostrar WhatsNexus", "Salir") and toggles visibility upon tray icon clicks.
  - Responds to `update-tray-badge` and `update-tray-settings` IPC events from the renderer.
- **Strict Safe External Link Dispatch:** Handles `open-external` and `open-external-url` IPC invocations with strict validation: restricts protocols strictly to `http:` and `https:`, blocking loopback/private network destinations (`localhost`, `127.0.0.1`, `0.0.0.0`, `::1`) and URLs with embedded credentials (`user:pass@host`).
- **System Downloads Management:** Intercepts `will-download` events on the default session and partitioned sessions (`persist:acc_*`), applying `item.setSavePath()` to automatically route incoming file downloads to the user-specified directory (or default `app.getPath('downloads')`).
- **Native Chromium Spellchecking:** Manages multi-session spellchecking across `session.defaultSession` and all partitioned guest sessions (`persist:acc_*`) via `session.setSpellCheckerLanguages()`, mapping interface language codes to standardized BCP-47 identifiers (`en-US`, `zh-CN`, `hi`, `es`, `fr`, etc.) and delegating dictionary downloads entirely to Chromium's native background subsystem.
- **Dynamic Async Locale Provisioning (`load-locale`):** Serves modular translation JSON files from `src/locales/` on demand to the renderer via asynchronous I/O (`fs.promises.readFile`) and caches parsed dictionaries in an in-memory `Map`, eliminating disk read overhead on repetitive language toggles.
- **Multi-Session Proxy Engine & Strict Isolation:** Dynamically provisions HTTP/SOCKS5 proxy rules or system proxy discovery across `session.defaultSession` and all partitioned sessions (`persist:acc_*`) via `session.setProxy()`. When Strict Proxy Isolation is enabled, local bypass rules are removed (`proxyBypassRules: ''`) to ensure no direct network connections evade the tunnel. Reverts to direct connections on demand (`{ mode: 'direct' }`).
- **WebRTC IP Leak Mitigation:** Enforces `session.setWebRTCIPHandlingPolicy('disable-non-proxied-udp')` at the Chromium networking layer across all sessions when WebRTC protection is enabled, preventing local and public IP disclosures over non-proxied UDP.
- **Real-Time System Diagnostics & Engine Introspection:** Exposes dynamic runtime parameters via IPC (`get-system-info`), sourcing live metrics directly from `app.getVersion()`, `process.versions` (Electron, Chromium, Node.js, V8), and Node's native `os` module (`os.type()`, `os.release()`, `os.arch()`).
- **Cross-Platform Window Identity & High-Resolution Icons:**
  - Explicitly assigns `APP_ICON_PATH` (`src/assets/icon.png`, 512x512 RGBA) to all `BrowserWindow` instances (`splashWindow` and `mainWindow`), ensuring consistent branding across Windows, macOS, and Linux desktop taskbars and docks.
  - Registers `app.setAppUserModelId('com.sentinelstudio.whatsnexus')` for Windows environments to enforce proper taskbar process grouping and notification center attribution.
  - Assigns `app.dock.setIcon(APP_ICON_PATH)` dynamically on macOS runtimes within `app.whenReady()`.
- **Dynamic Modular Theme Discovery & Security Auditing (`load-themes`):**
  - Scans `src/themes/*.json` on startup with defensive multi-path resolution (`app.getAppPath()`, development root, unpacked resources) to guarantee reliable asset discovery inside packaged `app.asar` archives.
  - Enforces JSON schema validation and category access control, demoting unauthorized third-party themes attempting to claim internal Tier 1 (`own`) or Tier 2 (`custom`) categories to Tier 5 (`community`).
  - Provides a resilient dual-layer fail-safe (`FALLBACK_BASE_THEME`) ensuring the core WhatsNexus palette is always initialized even under filesystem anomalies.
- **Automated OTA Update Engine:** Integrates `electron-updater` with `electron-log` targeting GitHub Releases (`Sentinel-Mexico/WhatsNexus-Dekstop`). Provides safe manual update verification, download progress streaming, and restart-and-install lifecycle control.

### 2.2 Secure Preloads (`src/preload-main.js` & `src/splash/splash-preload.js`)
- **Main Preload (`src/preload-main.js`):** Securely bridges IPC channels, platform diagnostics, webview preload paths, native notification dispatchers, download folder selectors, spellchecker configuration, network/proxy/WebRTC settings, system info introspection (`getSystemInfo`), locale loading (`loadLocale`), auto-updater commands (`window.electronAPI.updater`), and external browser link dispatchers to `window.electronAPI` via `contextBridge.exposeInMainWorld()`, fortified for Chromium sandbox execution.
- **Splash Preload (`src/splash/splash-preload.js`):** Exposes `window.splashAPI` for querying SemVer application versions and signaling transition completion.

### 2.3 Main Renderer (`src/renderer/`)
The primary UI layer consists of vanilla HTML5, CSS3, and modern JavaScript:
- **Design System & Typography:** Official typography using Google Fonts Poppins with preconnect directives, plus dedicated local font stacks (`src/assets/fonts/`) for constructed languages (Tengwar Telcontar for Elvish and Klingon pIqaD).
- **Curated Theme Engine & Customization Studio:** 16 curated color palettes modularized into standalone JSON definitions (`src/themes/*.json`) across 4 structured categories (Own, Custom, Messaging, and Pop Culture: WhatsNexus, Alto Contraste, Bosque, Cyber-Nexus, Dracula, Nord, Retro, Steampunk, Messenger, Signal, Telegram, WhatsApp, Doom, Star Trek, Star Wars, Vóxel) with synchronized Light/Dark variations, dynamic switch labels, and an interactive Customization Studio ("Personalización") enabling live CSS variable tuning.
- **Universal Custom Dropdown Engine:** Clean, centralized dropdown manager (`initCustomDropdown`) with outside-click tracking, automatic scroll-to-selected, and customizable option render callbacks (`renderOption`) to support specialized typography for constructed languages (Tengwar and Klingon) alongside standard ISO languages.
- **Sidebar Controller:** Manages the active visual state between accounts, Add Account modal/action, Bug Report dispatcher, Donations view (`#donate-btn`), and Settings view with a unified, floating tooltip system aligned 8px from the sidebar.
- **Full-Window Workspace:** Houses WhatsApp Web guest containers, an `#empty-state` placeholder, `#settings-view`, and `#donations-view`.
- **Donations Module:** Renders a responsive CSS grid of support platforms (GitHub Sponsors, PayPal) with external navigation safeguards powered by safe IPC invokes (`openExternalUrl`).
- **Session Manager:** Manages account metadata persistence in `localStorage` and `app.getPath('userData')/accounts.json`, orchestrates dynamic creation/removal of `<webview>` elements, and executes the 20-minute idle hibernation cycle.
- **Zero-Mute Multimedia Audio Pipeline:** Dispatches notification preferences without ever muting `webContents`, ensuring voice notes and chat videos play continuously. Configured with `--autoplay-policy=no-user-gesture-required`.
- **Modular Internationalization (i18n):** Translates the interface dynamically across 55 global languages using a lazy-loading architecture with in-memory `Map` caching from `src/locales/*.json`. Only the active locale and the `en.json` fallback are retained in memory, drastically optimizing RAM footprint.
- **Offline Protections & Network Auto-Reconnection:**
  - Dedicated container offline overlay with status badge and manual retry trigger on failed webview loads (`did-fail-load`).
  - System-wide `#reconnecting-modal` with high z-index backdrop that blocks accidental interactions when the machine loses Internet access, seamlessly auto-dismissing and reloading upon `window.addEventListener('online')`.

### 2.4 Guest Preload Script (`src/preload.js`)
Injected directly into each WhatsApp Web `<webview>` tag:
- **Profile Avatar Extraction & Observer Optimization:** Monitors WhatsApp Web DOM using a `MutationObserver` to retrieve the user's active profile picture (filtering out Meta AI icons/buttons) and passes it back to the host via `ipcRenderer.sendToHost('profile-picture-updated', avatarUrl)`. The fallback `setInterval` polling is immediately terminated once the `MutationObserver` activates, eliminating redundant background CPU cycles.
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
   - Subdivided into 7 specialized functional modules:
     - **Gestión de Cuentas (`#tab-accounts`):** Account registration, avatar synchronization, active/inactive toggles, DND switches, session cache hard-reset ("Limpiar Caché"), and safe deletion.
     - **Apariencia (`#tab-appearance`):** 16-palette dropdown across 4 tiers, dynamic Light/Dark/System mode selector, and tray icon style options.
     - **Personalización (`#tab-customizer`):** Real-time theme studio with HTML5 color pickers, 6-digit hex inputs, dual-mode editing (Light/Dark), and instant live CSS variable injection.
     - **Notificaciones (`#tab-notifications`):** Desktop alerts, sounds, and privacy presets (Broad, Medium, Strict, Custom).
     - **Permisos (`#tab-permissions`):** Granular hardware capability authorization (Microphone, Camera, Location, Screen Share) under Deny-by-Default rules.
     - **Privacidad y Red (`#tab-privacy`):** HTTP/SOCKS5 proxy tunnels, Strict Isolation mode, and WebRTC leak protection.
     - **Acerca de (`#tab-about`):** Real-time OTA updater state machine, system runtime diagnostics, Freedoom easter egg toggle, and GNU GPL v3 license modal trigger.
3. **Dedicated Donations View (`#donations-view`):**
   - Full-window view triggered by `#donate-btn` in the sidebar, positioned strictly between Bug Report and Settings.
   - Houses a card grid of project sponsorship channels (GitHub Sponsors, PayPal) with direct OS browser dispatching.
   - Includes a back navigation button returning to active chats.
4. **Empty State View (`#empty-state`):**
   - Displayed automatically when zero accounts exist or all accounts have been removed.
5. **Freedoom View (`#doom-view`):**
   - Full-window Easter Egg running Cloudflare's Chocolate Doom WebAssembly port natively and 100% offline with BSD-licensed Freedoom: Phase 1 (`freedoom1.wad`).
   - Features immediate sound effects without gesture blocking and a collapsible, dark-themed floating controls overlay.

---

## 4. Global Configuration Model (Universal Settings Enforcement)

All preferences defined across the Settings panels (**Cuentas**, **Apariencia**, **Personalización**, **Notificaciones**, **Permisos**, **Privacidad y Red**, and **Acerca de**) operate under a **Global Enforcement Architecture**:

1. **Universal Scope:** Configuration parameters are global application policies stored in `settings` (`localStorage`) and mirrored to the Electron main process via IPC (`permissions.json`, `system_settings.json`, `network_settings.json`, and `accounts.json`).
2. **Present Accounts:** Modifications made in Settings are reactively broadcast to all active `<webview>` instances, Chromium sessions, download interceptors, spellcheckers, network proxy tunnels, and audio outputs in real time.
3. **Future Accounts:** Whenever a new account is registered (`addAccount`) or awakened from hibernation (`wakeWebview`), its newly created `<webview>` and isolated partition (`persist:acc_*`) automatically inherit the full global settings schema upon instantiation, guaranteeing absolute behavioral consistency across all profiles without requiring manual per-account setup.

---

## 5. Modular Theme Engine & Customization Studio ("Personalización")

WhatsNexus features a decoupled, modular design token architecture that replaces static stylesheets with dynamically scanned JSON schemas and an interactive real-time Customization Studio.

```text
  src/themes/*.json (16 Built-in Schemas)
          │
          ▼
  Main Process (load-themes IPC + ASAR multi-path resolver + Tier access control)
          │
          ▼
  Renderer: initThemes() & Universal Custom Dropdown Engine
          │
          ├─────────────────────────────────────────────────┐
          ▼                                                 ▼
  Standard Palette Selection                 Customization Studio ("Personalización")
  (16 palettes across 4 tiers)               (Interactive HTML5 pickers + hex inputs)
          │                                                 │
          └────────────────────────┬────────────────────────┘
                                   │
                                   ▼
          applyThemeTokens() (Dual-Level Injection: :root + body.style)
                                   │
                                   ▼
          Derived Semantic Tokens propagated to modals, sidebars, and webview guests
```

### 5.1 Modular Theme Schemas (`src/themes/*.json`)
Each color scheme is defined in an isolated JSON schema declaring metadata and mode tokens:
- **Metadata:** `id`, `nameKey` (localized key from `src/locales/`), `category` (`own`, `custom`, `messaging`, `pop_culture`), `builtin: true`, and dynamic mode `labels` (e.g., "Overworld" / "Nether/End" for Vóxel; "Jedi" / "Sith" for Star Wars; "Día" / "Noche" for High Contrast).
- **Token Trees (`modes.light` and `modes.dark`):** Defines base background surfaces (`--bg-primary`, `--bg-sidebar`, `--bg-hover`, `--bg-modal`, `--whatsapp-bg`), typography and borders (`--text-primary`, `--text-secondary`, `--border-color`, `--text-on-accent`), and action accents (`--bg-active`, `--accent-hover`, `--accent-secondary`, `--accent-terracotta`, `--accent-crimson`).
- **Security & Categorization:** The main process audits loaded schemas. External or third-party additions attempting to inject into Tier 1 (`own`) or Tier 2 (`custom`) without presence in `OFFICIAL_THEME_IDS` are defensively demoted to Tier 5 (`community`).

### 5.2 Dynamic Startup Discovery & Fail-Safe Pipeline
- **ASAR & Unpacked Path Resolution:** The `load-themes` IPC handler in `src/main.js` scans candidate directories (`path.join(app.getAppPath(), 'src', 'themes')`, `path.join(__dirname, 'themes')`, and development roots), bypassing virtual filesystem limitations inside packaged `app.asar`.
- **Built-in Fail-Safe (`FALLBACK_BASE_THEME`):** If the filesystem is damaged or inaccessible, a hardcoded fallback definition of the WhatsNexus brand palette is returned to ensure the UI renders without errors.

### 5.3 Interactive Customization Studio (`#tab-customizer`)
Located as a dedicated section in the Settings view immediately before "Acerca de", the Customization Studio allows users to craft bespoke palettes:
- **Dual-Mode Editor:** Segmented controls allow editing Light and Dark tokens independently with instant visual reflection.
- **Bidirectional Color Controls:** Synchronizes native HTML5 color pickers (`<input type="color">`) with uppercase `#RRGGBB` text fields with input validation.
- **Live `:root` Cascade:** Token changes call `applyThemeTokens()` immediately without saving delays, injecting custom CSS variables into `:root` and `document.body.style`.
- **Automatic Palette Switch & Persistence:** Modifying any token automatically switches the active palette to `"custom"` ("Personalizado") and serializes the complete token dictionary into `settings.customTheme` in `localStorage`.
- **One-Click Reset:** A dedicated "Restablecer a valores de WhatsNexus" action restores custom tokens back to official WhatsNexus defaults.
