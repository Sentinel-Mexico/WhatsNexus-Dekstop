# Changelog

All notable changes to the stable releases of WhatsNexus Desktop are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.3.2] - 2026-09-10
### Optimized
- **Chromium Efficiency Switches & Tab Hibernation Throttling:**
  - Configured switches before `app.whenReady()` in `src/main.js`: enabled background timer throttling (`disable-background-timer-throttling=false`) and activated performance feature flags `CalculateNativeWinOcclusion`, `IntensiveWakeUpThrottling`, and `ThrottleDisplayNoneAndVisibilityHiddenCrossOriginIframes` to allow Chromium to freeze timers and throttle background tasks in non-visible contexts.
  - Implemented background tab throttling and visibility toggling upon account switching in `src/renderer/renderer.js`: inactive `<webview>` tags are marked `visibility: hidden` and dispatched a `set-tab-active: false` signal, reducing background rendering overhead. Active accounts receive `visibility: visible` and `set-tab-active: true`.
- **Clean Memory Management & Explicit WebContents Destruction:**
  - Added explicit `webContents.stop()` and `webContents.destroy()` invocations in `src/main.js` for all partition-bound WebContents during account deletion (`delete-account-data`) and added a new IPC channel `destroy-webview-contents`.
  - Updated `hibernateWebview(id)` and `executeDeleteAccount(id)` in `src/renderer/renderer.js` to call `webview.stop()` and invoke `electronAPI.destroyWebviewContents(partition)` before DOM removal, eliminating dangling Chromium renderer processes.
  - Exposed `destroyWebviewContents` in `src/preload-main.js` under `window.electronAPI`.
- **Adaptive Network Polling (Smart Polling) & Power-Saving Pausing:**
  - Replaced linear interval polling in `startOfflinePolling()` with an adaptive stepped schedule (`[5000, 10000, 30000, 60000]` ms) that backs off gracefully during extended outages.
  - Paused offline polling probes and duration timer DOM ticks when the application window is minimized or hidden (`document.hidden`). Automatically resumes polling and synchronizes duration on window `visibilitychange` and `focus`.
- **DinoGame & Overlay Dormancy:**
  - Added `visibilitychange` and `blur` event listeners to `DinoGame` in `src/renderer/dino-game.js` to cancel active `requestAnimationFrame` render loops via `pausar()` when the window loses focus or visibility.
  - Updated `destruir()` to cleanly deregister all event listeners (`blur`, `visibilitychange`, `resize`, `keydown`, `keyup`, `click`).
- **Guest Preload DOM Observer Optimization:**
  - In `src/preload.js`, bound `set-tab-active` IPC listener to track tab focus state; bypassed DOM scanning and interval execution when tab is inactive.
  - Narrowed `MutationObserver` scope from unbounded `document.body` to `#app` / `#side` containers, increased debounce interval to 2500ms, and implemented a hard 60-second self-termination timer to free observer resources once profile data is acquired.

## [2.3.1] - 2026-09-10
### Fixed
- **External Web Link Interception & System Browser Delegation:**
  - Resolved critical navigation bug where clicking hyperlinks inside WhatsApp conversations either failed silently or attempted to navigate inside the sandboxed `<webview>` container instead of opening the user's default OS browser.
  - Implemented multi-layered navigation interception:
    - **Main Process (`src/main.js`):** Registered `setWindowOpenHandler` and `will-navigate` listeners on `mainWindow.webContents`, all dynamic `<webview>` instances upon `did-attach-webview`, and globally via `app.on('web-contents-created')`. Non-internal URLs are intercepted, blocked from internal guest rendering (`event.preventDefault()`, `{ action: 'deny' }`), and forwarded to `shell.openExternal(url)`.
    - **Guest Preload (`src/preload.js`):** Attached capture-phase event listeners on `click` and `auxclick` (middle click) on all `<a>` tags with valid `href` attributes, capturing both external URLs and `target="_blank"` anchors before WhatsApp Web's synthetic React event dispatchers can suppress them, forwarding to `ipcRenderer.send('open-external', url)`. Overrode guest `window.open` to safely redirect to external browser.
    - **Renderer Process (`src/renderer/renderer.js`):** Attached `new-window` and `will-navigate` event handlers on all mounted `<webview>` elements (including Doom minigame), cleanly delegating to `window.electronAPI.openExternal(url)`.
  - Hardened protocol and security validation (`isSafeExternalUrl`): Enforced strict protocol filtering (`http:`, `https:`, and validated `mailto:`), blocked embedded credentials (`username`/`password`), and prevented SSRF against internal/local interfaces (`127.0.0.1`, `localhost`, `::1`, `169.254.`, `*.local`).
  - Implemented `isInternalNavigationUrl` to strictly protect legitimate WhatsApp Web runtime navigations (`web.whatsapp.com`, `about:blank`, local `file:` assets) while preserving conversation state.

## [2.3.0] - 2026-09-10
### Added
- **Automatic & Non-Intrusive Background Update Workflow:**
  - Configured silent background update verification at application launch, triggered 1.5s after the splash window transition completes (6.5s post-boot) to ensure zero latency during WhatsApp `<webview>` initialization and account mounting.
  - Implemented dual update resolution pipeline supporting both `electron-updater` and a lightweight HTTP fallback against GitHub Releases API (`api.github.com/repos/Sentinel-Mexico/WhatsNexus-Dekstop/releases/latest`) with SemVer version comparison.
  - Handled network errors, offline states, and GitHub API rate limits defensively with silent failure suppression in background mode.
  - Configured full IPC channel suite with primary and alias routes (`updater:check` / `check-for-updates`, `updater:start-download` / `download-update`, `updater:install-and-restart` / `install-update`).
  - Exposed complete updater lifecycle methods and subscription handlers in `src/preload-main.js` under `window.electronAPI.updater`.
- **Interactive Themed Update Notification Modal:**
  - Added `#update-notification-modal` component in `src/renderer/index.html` strictly managed with `.app-modal-backdrop.hidden` (`display: none !important`, `pointer-events: none !important`, `z-index: -1 !important`) to eliminate phantom click interception.
  - Styled with application theme design tokens (`--bg-modal`, `--border-color`, `--bg-active`, `--text-primary`, `--text-secondary`).
  - Implemented 20-second upgrade window advisory message with dual actions:
    - Primary: `"Actualizar y reiniciar"` triggering download state, disabling buttons to prevent double-clicks, and displaying a live progress bar with percentage.
    - Secondary: `"Recordar más tarde"` dismissing the modal without disrupting ongoing communications.
  - Synchronized real-time state with the existing manual `"Buscar actualizaciones"` button in the About tab.
  - Enforced 100% internationalization coverage (365 keys) across all 55 supported languages for all modal labels and status indicators.

## [2.2.9] - 2026-09-06
### Fixed
- **100% Internationalization (i18n) Coverage for Customization Subsystem:**
  - Resolved critical i18n coverage gap where the "Personalización" (Color Customization) tab label, section headers, segmented mode controls, and color token descriptions defaulted to hardcoded English strings across non-English locales (notably Arabic, Persian, Urdu, Pashto, Sindhi, Asian, Indic, and African languages).
  - Translated and synchronized 30 critical keys across all 55 supported locale dictionaries in `src/locales/`:
    - Navigation & Panel: `tab_customization`, `heading_customization`, `desc_customization`.
    - Mode Toggles & Actions: `custom_mode_edit_dark`, `custom_mode_edit_light`, `btn_reset_custom_theme`.
    - Token Groups: `custom_group_backgrounds`, `custom_group_typography`, `custom_group_accents`.
    - Surface Tokens: `token_bg_primary`, `token_bg_sidebar`, `token_bg_hover`, `token_bg_modal`, `token_whatsapp_bg`.
    - Typography Tokens: `token_text_primary`, `token_text_secondary`, `token_border_color`, `token_text_on_accent`.
    - Accent & State Tokens: `token_bg_active`, `token_accent_hover`, `token_accent_secondary`, `token_accent_terracotta`, `token_accent_crimson`.
    - Palette Categories & Options: `category_main`, `category_custom`, `category_messaging`, `category_pop_culture`, `category_user`, `palette_custom`, `theme_system`.
  - Preserved all technical CSS variable names in parentheses (e.g. `(--bg-primary)`) while translating descriptive labels naturally into each target tongue.
  - Verified 100% key symmetry and parity (359 keys across each of the 55 locale files) with zero English fallbacks in non-English dictionaries.
  - Verified live reactivity in `updateTranslations()` ensuring immediate DOM re-rendering when switching languages in real time without application restarts.

## [2.2.8] - 2026-09-06
### Fixed
- **Global Scope Syntax Error Elimination & Script Execution Restoration:**
  - Removed conflicting top-level `const electronAPI = window.electronAPI;` declaration in `renderer.js` that caused V8 to throw `Uncaught SyntaxError: Identifier 'electronAPI' has already been declared` upon script parsing due to `contextBridge.exposeInMainWorld('electronAPI', ...)` defining a non-configurable global accessor on `window`.
  - Restored full execution and event registration across all renderer subsystems, resolving total interface freeze where sidebar navigation buttons and account tabs were non-responsive.
- **Centralized & Early Navigation Listener Binding (`setupSidebarListeners`):**
  - Unified all bottom sidebar action handlers (`#add-account-btn`, `#settings-btn`, `#donate-btn`, `#report-bug-btn`, `#doom-btn`) inside an idempotent `setupSidebarListeners()` function protected by `dataset.bound` flags against listener duplication.
  - Executed `setupSidebarListeners()` immediately upon script evaluation, at the beginning of `init()`, and inside `DOMContentLoaded` to guarantee immediate interactivity regardless of asynchronous initialization tasks.
  - Defensively chained asynchronous IPC calls (`setSpellcheckerLanguages`, `saveAccounts`) with `.catch(() => {})` to eliminate unhandled promise rejections during cold boot.
- **Ghost Layer Suppression & CSS Pointer-Events Hardening:**
  - Enforced `display: none !important; pointer-events: none !important; z-index: -1 !important;` on `.app-modal-backdrop.hidden`, `.offline-overlay.hidden`, and `.hibernation-overlay.hidden` to eliminate phantom click interception and transparent backdrop hit-testing blocking.
  - Hardened `.sidebar` with `position: relative; z-index: 50; pointer-events: auto;` guaranteeing the navigation rail remains strictly stacked above any guest webview surface or internal container overlays.

## [2.2.7] - 2026-09-06
### Fixed
- **Sidebar Account Tabs & DOM Synchronization Resolution:**
  - Resolved critical regression where active account icons disappeared from the left sidebar navigation rail due to missing IPC method exposures (`updateTraySettings` and `setThemeMode`) in `preload-main.js` which caused an unhandled `TypeError` during `applySettings()` in the cold-start initialization sequence.
  - Exposed `updateTraySettings` and `setThemeMode` in `preload-main.js` context bridge and declared `const electronAPI = window.electronAPI;` for safe, reliable global access across execution scopes.
  - Implemented early rendering of sidebar account tabs immediately on DOM readiness from cached account configurations, preventing delays or failure cascading from downstream asynchronous network or updater tasks.
  - Wrapped all subsystem initialization steps in defensive `try/catch` blocks and enforced `typeof electronAPI.<method> === 'function'` checks in `applySettings()`.
  - Added defensive error handling in `getAvatarHtml()` with `onerror` attribute falling back smoothly to `<i class="fa-solid fa-circle-user"></i>` to prevent broken avatar URLs from blocking tab mounting.
  - Normalized legacy asset image paths in existing account profiles (mapping `src/assets/` to `src/assets/img/`).
  - Ensured active account state (`.active`) selection and verified `<webview>` container mounting and visibility upon account activation.

## [2.2.6] - 2026-09-06
### Fixed
- **Universal Hardware & Session Permissions Resolution (Microphone, Camera, Notifications):**
  - Resolved structural failure in Chromium session permission checks where `PermissionCheckDetails.mediaType` (singular string) was not evaluated, causing `setPermissionCheckHandler` and `setPermissionRequestHandler` to reject microphone requests and trigger WhatsApp Web's blocking "Permitir micrófono" dialog when recording voice messages.
  - Implemented `checkMediaPermission` in the main process to comprehensively support direct permission names (`'microphone'`, `'camera'`, `'audio'`, `'video'`) and `'media'` requests with both singular `mediaType` and plural `mediaTypes` payloads under user-configured settings.
  - Implemented `checkDisplayCapturePermission` supporting both `mediaType` and `mediaTypes` for screen sharing with audio.
  - Allowed clipboard permissions (`clipboard-read`, `clipboard-sanitized-write`) for seamless chat media copy/paste in webview sessions.
  - Proactively registered permission handlers across all persisted account partitions (`persist:acc_*`) at application startup and during dynamic account registration (`save-accounts`).
- **Real-Time Reactive Permission & Privacy Synchronization:**
  - Implemented real-time IPC broadcasting (`broadcastPermissionsToAllWebContents`) delivering `permissions:updated` and `notifications:updated` across all active `webContents` and `<webview>` instances when toggling settings in the UI.
  - Enhanced webview `preload.js` with dynamic `appPermissions` and `notificationSettings` state updating reactively without requiring application restarts.
  - Extended `navigator.permissions.query` interception in webviews to support `'microphone'`, `'camera'`, `'geolocation'`, and `'notifications'`, returning `{ state: 'granted' }` (or `'denied'`) based on reactive settings and dispatching standard `change` events.
  - Guarded `navigator.mediaDevices.getUserMedia` and legacy `navigator.getUserMedia` in webviews to cleanly reflect active user device permissions and prevent hangs.
  - Implemented robust `CustomNotification` class inheriting from `EventTarget.prototype` with `.close()`, dynamic `permission` getter, and instant `requestPermission` resolution, completely eliminating the browser address bar "Permitir notificaciones" modal.

## [2.2.4] - 2026-09-05
### Added
- **Expanded Multiplatform Distribution Channels (AppX, MSIX, Snap, Pacman, AUR):**
  - **Windows Store & Enterprise Modern Packaging:** Added Windows `appx` target configuration in `package.json` with identity parameters (`SentinelMexico.WhatsNexus`), application ID (`WhatsNexus`), display name, publisher identity, and dual-language declarations (`es-ES`, `en-US`).
  - **Automated MSIX Generation Hook:** Implemented `scripts/generate-msix.js` as an `afterAllArtifactBuild` hook in `electron-builder` to automatically mirror AppX packages into `.msix` bundles with synchronized artifact registration.
  - **Canonical Snap Store Packaging:** Added `snap` target with strict confinement (`confinement: "strict"`, `grade: "stable"`) and comprehensive plug bindings (`default`, `network`, `network-bind`, `desktop`, `desktop-legacy`, `x11`, `wayland`, `unity7`, `audio-playback`, `pulseaudio`, `browser-support`).
  - **Native Arch Linux Distribution (`.pacman`):** Configured `pacman` target with xz compression, package categorization, and system integration.
  - **Arch Linux / AUR Packaging Template:** Created `scripts/aur/PKGBUILD.template` providing the complete PKGBUILD recipe for `whatsnexus-bin`, including `/opt/whatsnexus` installation, `/usr/bin/whatsnexus` binary symlinks, `.desktop` launcher entry, and 512x512 hicolor application icons.
  - **GitHub Actions Multiplatform Matrix Pipeline Enhancement (`.github/workflows/build.yml`):** Configured Linux packaging toolchains (`libarchive-tools`, `zstd`, `snapcraft`) on Ubuntu runners for seamless `.snap` and `.pacman` assembly, integrated automated Windows post-build MSIX assurance step, and expanded artifact collection/publishing globs for all new distribution formats.
- **Redesigned Bifurcated Offline Protections & UI Isolation:**
  - Scoped offline overlay strictly inside `#webview-container` (`z-index: 20`), ensuring lateral sidebar (`<aside class="sidebar">`) and native views (`#settings-view`, `#donations-view`, `#doom-view`) remain 100% accessible and interactive when offline.
  - **Escenario A (Hot Disconnection During Active Use):** Implemented passive reconnection wait with top animated radar spinner, pulsing indicator badge (`reconnecting_status`), and zero disturbance to underlying webviews, safeguarding draft messages and conversation context.
  - **Escenario B (Cold Startup / Offline Boot):** Implemented active reconnection wait with localized title, subtitle (`offline_screen_startup_desc`), and interactive "Volver a escanear" button (`btn_rescan`).
- **Modular Retro T-Rex Runner Minigame Engine (`src/renderer/dino-game.js`):**
  - Modularized minigame architecture into an independent `DinoGame` class loaded lazily on demand (`ensureDinoGameLoaded()`) with leak-free lifecycle destruction (`destruir()`).
  - Expanded canvas dimensions to 100% container width and 300px height (`groundY = 260px`) for optimal flight clearance and parabolic jump trajectory.
  - Implemented 3-tier aerial Pterodactyl enemies spawning across low, mid, and high altitudes with animated wing flapping.
  - Configured strict keyboard controls (`ArrowUp` to jump/restart, `ArrowDown` to duck with reduced 24px hitbox).
  - Dynamic Theme Adaptation: Automatically repaints game elements using active CSS palette variables (`--text-primary`, `--accent-color`, `--border-color`, `--text-secondary`, `--whatsapp-bg`) across all 16 themes via MutationObserver.
- **Dynamic Offline Duration Timer:**
  - Integrated real-time counter ticking every second (`Estamos sin conexión desde hace {tiempo} {medición}.`), dynamically formatting seconds, minutes, hours, and days without hardcoded strings.
- **Comprehensive 55-Language Internationalization (i18n):**
  - Maintained 100% symmetric key parity across all 55 active locale dictionaries (359 keys each), adding translations for offline status, rescan button, minigame hints, and time duration counters.

### Changed
- **Static Asset Structure Optimization (`src/assets/img/`):**
  - Physically migrated all raster and vector image assets (`icon.png`, tray icons, monochrome/color logos, and badge variants) from `src/assets/` into a dedicated `src/assets/img/` subfolder.
  - Exhaustively updated all asset references across main process (`src/main.js`), renderer markup (`src/splash/splash.html`, `src/renderer/index.html`), packaging configuration (`package.json`), Arch Linux AUR script (`scripts/aur/PKGBUILD.template`), and technical documentation (`docs/`).
- **Clean Code Separation in Renderer:**
  - Decoupled minigame engine from `renderer.js`, implementing dynamic script injection and centralized offline event handlers.

### Fixed
- **Cold Start Offline Black Screen Bug Resolution (Escenario B):**
  - Eliminated premature overlay dismissal caused by partition disk cache (`persist:acc_*`) firing `dom-ready` and `did-finish-load` events during offline cold starts. Webview lifecycle listeners strictly guard against hiding the overlay when an offline scenario is active.
  - Implemented `checkInitialNetworkState()` as an agnostic, imperative startup verification function running on cold starts, independently verifying network connectivity before webview activation without relying on cached flags or `localStorage`.
  - Hardened `did-fail-load` event handling to intercept all critical network failures (`ERR_INTERNET_DISCONNECTED`, `ERR_NAME_NOT_RESOLVED`, `ERR_CONNECTION_REFUSED`, etc.) and route them directly to Escenario B.
- **Interactive Rescan Button Animation & Validation (Escenario B):**
  - Configured `#offline-rescan-btn` with immediate click lock (`disabled = true`, `pointer-events: none`, `opacity: 0.7`, and `.loading` class) preventing duplicate triggers.
  - Integrated animated circular loading spinner (`fa-spinner fa-spin btn-spinner`) and localized connecting text (`status_connecting`).
  - Implemented connectivity verification against `https://web.whatsapp.com` requiring HTTP 200–299 responses via backend IPC `check-internet` (utilizing Electron's `net.isOnline()`) and frontend fetch fallback. On success, reloads all active account webviews and dismisses the overlay; on failure or non-2xx status, halts the spinner and gracefully reactivates the button in idle state.
- **Linux Webview Occlusion Resolution:**
  - Resolved `<webview>` out-of-process surface occlusion over HTML overlay on Linux platforms during network load failures by dynamically toggling `visibility = 'hidden'` on `<webview>` elements when the offline overlay is visible and restoring them upon reconnection.
- **Background Reconnection Polling & Content Security Policy:**
  - Updated CSP in `src/renderer/index.html` to allow `https://github.com` and `https://web.whatsapp.com` in `connect-src`.
  - Implemented IPC-backed connectivity checks avoiding renderer sandboxing and browser `navigator.onLine` stale states.

## [2.0.2] - 2026-09-05
### Fixed
- **Cross-Platform Window Identity & High-Resolution Icon Assignment:**
  - Resolved generic framework fallback icon issue on the startup splash screen and secondary windows across Windows, macOS, and Linux desktop environments.
  - Explicitly assigned 512x512 high-resolution icon (`APP_ICON_PATH`) to all `BrowserWindow` instances (`splashWindow` and `mainWindow`) in `src/main.js`.
  - Regenerated `src/assets/icon.png` at 512x512 RGBA directly from the official vector source (`src/assets/whatsnexus-logo.svg`) for pixel-perfect HiDPI display rendering.
  - Configured `app.setAppUserModelId('com.sentinelstudio.whatsnexus')` for Windows, ensuring native taskbar grouping and notification attribution.
  - Configured runtime macOS dock icon assignment via `app.dock.setIcon(APP_ICON_PATH)` within `app.whenReady()`.
  - Configured `"icon": "src/assets/icon.png"` and included `"src/assets/**/*"` in `build.files` inside `package.json` for `electron-builder` packaging.

### Changed
- **Technical Documentation & QA Audit Suite:**
  - Fully expanded architectural and testing documentation across `/docs`, formally documenting the 7-tab navigation model, the Theme Customization Studio ("Personalización"), modular theme schema specifications, and automated integrity validation scripts.

## [2.0.1] - 2026-09-05
### Fixed
- **Production Theme Packaging & Dynamic Theme Scanner (`app.asar`):**
  - Resolved a critical issue in packaged production distributions where the modular theme scanner failed to load JSON schemas inside `app.asar`, causing the appearance palette menu to only display the "Personalizado" option.
  - Added explicit `files` packaging configuration (`"src/**/*"`, `"src/themes/**/*"`, `"package.json"`) in `package.json` under `build` for `electron-builder`.
  - Fortified `load-themes` IPC handler in `src/main.js` with multi-path resolution (`app.getAppPath()`, development root, unpacked resources) and virtual directory descriptor bypasses.
  - Implemented dual-layer fallback (`FALLBACK_BASE_THEME`) in both main and renderer processes, guaranteeing the primary WhatsNexus palette is always initialized.

## [2.0.0] - 2026-09-05
### Added
- **Modular Theme Architecture (`src/themes/`):**
  - Completely modularized all 16 built-in color palettes into standalone JSON schemas (`src/themes/*.json`) across 4 tiers (Own, Custom, Messaging, and Pop Culture).
  - Added startup filesystem scanning and security validation via IPC handler `load-themes` in `src/main.js`, shielding system categories against unauthorized third-party escalation.
  - Implemented dynamic runtime token injection into `:root`, removing over 600 lines of coupled static CSS stylesheets.
- **Interactive Theme Customization Studio ("Personalización"):**
  - Integrated a dedicated real-time customization workspace directly in the navigation hierarchy.
  - Features real-time dark/light segmented controls, interactive HTML5 color pickers, and validated 6-digit hex input fields for immediate UI tuning.
- **Expanded Feature Comparison Matrix:**
  - Enriched the repository documentation with an in-depth comparative evaluation table benchmarking WhatsApp Web, the official native WhatsApp Desktop app, ZapZap, and WhatsNexus across 18 technical capabilities.

### Changed
- **Major Runtime Upgrade to Electron 43 & Dependency Alignment:**
  - Migrated core desktop runtime from legacy Electron 29 to **Electron 43 (`^43.6.0`)**, unlocking modern Chromium sandbox primitives, V8 performance optimizations, and full Wayland/Linux desktop compatibility.
  - Upgraded `electron-builder` to `^26.15.3` ensuring modern distribution targets across Linux (AppImage, deb, rpm), Windows (NSIS, portable), and macOS.
  - Aligned CI/CD workflow (`.github/workflows/build.yml`) to utilize pure `npm ci` resolution without version pinning.
- **Universal Custom Dropdown Engine & Clean Code Refactoring:**
  - Enhanced `initCustomDropdown()` in `src/renderer/renderer.js` to support extensible `renderOption(opt, targetEl)` callbacks.
  - Extracted `renderLanguageOption()` to provide high-fidelity typography rendering for constructed languages (Elvish Tengwar and Klingon pIqaD font stacks) seamlessly alongside standard ISO languages.
  - Refactored `populateLanguageSelect()`, eliminating over 90 lines of duplicate DOM elements, manual active class toggles, and redundant click listeners.
  - Visual polish across category headers in theme dropdowns, removing decorative hyphens and enforcing uppercase display cleanly via CSS `text-transform`.
- **Dracula Palette Aesthetic Overhaul:**
  - Redesigned `src/themes/dracula.json` to feature deep crimson red accents (`#991111`, `#8B0000`) and charcoal dark gray backgrounds (`#121214`), preventing eye strain while capturing the authentic Dracula aesthetic.

### Fixed
- **Dynamic Light Theme Override Bug:**
  - Fixed an issue where selecting light mode on custom themes mistakenly rendered default WhatsNexus light tokens due to a high-specificity static CSS block.
  - Implemented dual-level token injection on `:root` and `document.body.style` for guaranteed runtime cascade.
- **High Contrast Dark Dropdown Legibility:**
  - Configured `.custom-option.selected` to utilize `color: var(--text-on-accent, #ffffff)`, rendering bold black text over high-contrast yellow accent backgrounds (`#FFE600`) for 100% legibility.

## [1.6.1] - 2026-09-05
### Added
- **Account Cache Reset (Hard Reset) per Session:**
  - Added a dedicated "Limpiar Caché" action button with `fa-arrows-rotate` icon to each active account card in Settings.
  - Implemented the `clear-account-cache` IPC channel invoking Electron Session APIs (`ses.clearCache()` and selective `ses.clearStorageData()` targeting cache, serviceworkers, and shadercache while preserving authentication cookies and IndexedDB to prevent user logout).
  - Automatically reloads the target webview via `webview.reloadIgnoringCache()` to restore frozen WhatsApp Web sessions.
  - Added `btn_clear_cache` localization across all 55 supported locale JSON files.
- **Automated GitHub Actions Release Notes:**
  - Integrated dynamic changelog extraction into `.github/workflows/build.yml` in the unified `release` job.
  - The step dynamically parses the newest release block from `changelog-dev.md` or `changelog.md` into `RELEASE_NOTES.md` and passes it as `body_path` to `softprops/action-gh-release@v2`.

### Fixed
- **Packaged App Account Management Actions (.AppImage / app.asar):**
  - Resolved issue in packaged production builds where "Eliminar" and the "Estado de la cuenta / Activa" toggle failed to respond due to inline event handler attributes being blocked by Chromium Content Security Policy (`script-src 'self'`).
  - Refactored `renderSettingsAccounts()` to attach programmatic DOM event listeners (`addEventListener`) for edit, delete, status toggle, clear cache, and DND controls.
  - Implemented persistent account storage in `app.getPath('userData')/accounts.json` with dedicated IPC handlers (`get-accounts`, `save-accounts`, `delete-account-data`), eliminating file access failures inside `app.asar`.
- **Enforced 5-Second Splash Screen Lifecycle:**
  - Enforced immediate visibility (`show: true`, `.show()`, `.focus()`) of `splashWindow` upon `app.whenReady()`.
  - Implemented a strict 5000ms (`setTimeout`) lifecycle timer, ensuring the splash screen displays for exactly 5 seconds before destroying `splashWindow` and revealing `mainWindow` simultaneously.
  - Synchronized the splash progress bar animation in `src/splash/splash.js` to 4800ms to smoothly match the 5-second window.

### Changed
- **Standardized Packaging Artifact Naming Convention (`artifactName`):**
  - Configured `build.artifactName` in `package.json` to enforce `whatsnexus-${version}-${os}-${arch}.${ext}` across all platform distributions (AppImage, deb, nsis/exe, dmg).

## [1.5.0] - 2026-09-05
### Added
- **Curated Theme Engine Expansion (16 Palettes across 4 Structured Tiers):**
  - Integrated 6 new color palettes with complete light and dark design tokens:
    - *Tier 2 (Custom / Original):* **Cyber-Nexus** (Chrome Core / Neural Net), **Dracula** (Alucard / Dracula Official), **Nord** (Snow Storm / Nord Official).
    - *Tier 4 (Pop Culture):* **Doom** (Phobos Base / Hellscape), **Star Trek** (Federation Day / LCARS Terminal), **Vóxel** (Overworld / Obsidian & The End).
  - Implemented dynamic theme switch labels for specialized palettes (e.g., "Overworld" / "Nether/End" for Vóxel, "Jedi" / "Sith" for Star Wars, "Día" / "Noche" for High Contrast).
  - Enforced strict 4-tier visual hierarchy with internal alphabetical ordering across all palette selections.
- **Global Internationalization (i18n) Expansion & Parity:**
  - Expanded locale support to 55 global languages with 100% symmetric key parity (318 keys per language) and zero English fallback.
  - Full authentic transliteration and native font rendering for constructed languages (Elvish Tengwar using Tengwar Telcontar and Klingon using authentic CSUR pIqaD).
- **Asynchronous Locale Provisioning & In-Memory Caching:**
  - Migrated the `load-locale` IPC channel to asynchronous non-blocking file I/O (`fs.promises.readFile`) paired with an in-memory `Map` cache, eliminating disk thrashing when switching languages.

### Fixed
- **Settings Navigation Default Tab Enforcement:**
  - Deactivated sticky tab memory behavior in Settings; opening the settings view now reliably resets to the default "Gestión de cuentas" tab (`#tab-accounts`).
- **Language Selector Conlang Rendering & Deduplication:**
  - Eliminated duplicate entries for Klingon in the language dropdown and normalized flexbox inline alignment to remove unwanted spacing around parenthesized native script names.
- **Security & External URL Sanitization:**
  - Hardened external URL dispatchers (`open-external-url`) with protocol whitelist (`http:`, `https:`) and validation blocking loopback IP addresses, private subnets, and embedded credentials.

## [1.0.4] - 2026-09-05
### Fixed
- **Linux Packaging Metadata (.deb Compliance):**
  - Configured structured `author` metadata with name and email (`Sentinel Studio <studio@sentinelstudio.com>`) in `package.json`, fulfilling strict Debian package maintainer requirements.
- **CI/CD Snapcraft Automation:**
  - Integrated `snapcraft` installation into the Ubuntu Linux dependencies workflow step in `.github/workflows/build.yml`, eliminating runner `ENOENT` packaging errors.
### Changed
- **Repository Governance & Quartet Synchronization:**
  - Standardized the Mandatory Version Synchronization Quartet across `changelog-dev.md`, `package.json`, `package-lock.json`, and the root `README.md` badge.

## [1.0.3] - 2026-09-04
### Fixed
- **Classic Doom WebAssembly Engine Execution & Black Screen Resolution:**
  - Resolved an engine startup deadlock in the Chocolate Doom WebAssembly port by suppressing unconfigured MIDI initialization via `-nomusic`, enabling instant WebGL canvas initialization and smooth 3D rendering.
  - Corrected keybindings shown in the floating controls overlay: firing mapped to Spacebar and Left Click, and door interaction/activation mapped to `E`.
  - Added horizontal steering controls to the overlay, supporting camera steering via mouse movement or keyboard keys `O` (turn left) and `P` (turn right).
  - Integrated browser pointer lock (`canvas.requestPointerLock()`) on canvas click for fluid 360-degree mouse look, along with container click autofocus.
  - Added an informational note regarding classic DOOM (1993) level design mechanics where vertical jumping does not exist in the original vanilla engine.
### Changed
- **CI/CD Multiplatform Pipeline Stability (Ubuntu 24.04 Runners):**
  - Updated `.github/workflows/build.yml` with deb822 source list isolation for Ubuntu 24.04 (`noble`) runners, directing ARM64 cross-compilation toolchains exclusively to `ports.ubuntu.com`.
- **Repository Governance Standards:**
  - Updated operational rules in `.agents/rules/` and governance index in `.agents/README.md` to mandate automated push to `Dev` on every version bump, strict triad synchronization (`changelog-dev.md`, `package.json`, `package-lock.json`), and English-only documentation and notes policy.

## [1.0.1] - 2026-09-04
### Changed
- **Governance & Strict Version Synchronization Triad:**
  - Standardized agent operational rules in `.agents/rules/` establishing the mandatory version synchronization triad (`changelog-dev.md`, `package.json`, and `package-lock.json`).
  - Enforced 100% parity verification on `package-lock.json` across all version increments prior to committing.
### Fixed
- **Package Management Stability & Optimization:**
  - Streamlined package workflows and eliminated lifecycle script deadlocks during dependency and lockfile verification.

## [1.0.0] - 2026-09-04
### Added
- **First Official Stable Production Release (Out of Beta):**
  - Promoted WhatsNexus to its first production-grade milestone (`1.0.0`), concluding the initial beta phase.
  - Consolidated full architectural and technical documentation across `README.md` and `docs/`.
- **Comprehensive Auto-Updater Architecture (OTA Updates):**
  - Integrated `electron-updater` and `electron-log` targeting GitHub Releases (`Sentinel-Mexico/WhatsNexus-Dekstop`).
  - Built interactive visual state machine in the "About" settings section featuring manual update checks, live percentage readouts, and one-click restart-to-install workflows.
- **Offline Protection & Automatic Network Reconnection Subsystem:**
  - Dedicated offline status screen for individual account views with interactive retry action on network load failure (`did-fail-load`).
  - Global high-z-index `#reconnecting-modal` with backdrop blur and animated synchronization ring preventing accidental chat interaction during network outage.
  - Reactive auto-reconnect and refresh upon internet restoration (`window.addEventListener('online')`).
- **Official Migration of DOOM to Cloudflare WebAssembly (Chocolate Doom):**
  - 100% native and offline integration of Cloudflare's Chocolate Doom WebAssembly port (`cloudflare/doom-wasm`).
  - Eliminated external network dependencies; ultrafast asset loading via concurrent `fetch()` and direct injection into Emscripten virtual filesystem.
  - Immediate audio playback and user-gesture unblocking via `--autoplay-policy=no-user-gesture-required` and custom audio unlocking.
  - Dark-themed floating controls overlay card with collapsible toggle button for clean view.
- **Official Typography Migration to Google Fonts Poppins:**
  - Adopted Poppins font family (weights 300, 400, 500, 600, 700) across all views, startup splash screen, and settings drawers.
- **Official WhatsNexus Brand Palette:**
  - New default curated color scheme with light and dark mode variants optimized for high contrast, legibility, and long-session visual comfort.
- **Automated Multiplatform CI/CD Pipeline:**
  - GitHub Actions build and release workflow (`.github/workflows/build.yml`) for Linux (.deb, .AppImage, .snap for x64 and arm64), macOS (.dmg for x64 and arm64), and Windows (.exe NSIS for x64).
- **Account Deletion Confirmation Dialog:**
  - Security modal `#delete-account-modal` with warning details, Escape key dismissal, and explicit confirmation to prevent accidental session loss.

---

## [0.18.2] - 2026-09-03
### Changed
- **Official WhatsNexus Brand Identity & Icons Refresh:**
  - Regenerated master application icons and tray icons (`src/assets/`) from official high-resolution vector sources (`icon.png`, `tray-green.png`, `tray-light.png`, `tray-dark.png`, and badge variants).
  - Updated the Splash Screen to present the vector `whatsnexus-logo.svg` asset.
  - Updated the About view (`#tab-about`) with crisp vector `whatsnexus-logo.svg` branding.

---

## [0.18.1] - 2026-09-03
### Fixed
- **Descriptive Subtitles for Permission & System Modules:**
  - Added clean secondary subtitles (`.perm-group-desc`) beneath headers for Device Access, Screen Sharing, Download Management, and Spellchecker across all 26 supported languages.
- **Uncapped Fluid Height for Spellchecker Tag Cloud:**
  - Removed vertical scrollbar and `max-height` constraints on `.spellcheck-multiselect-container` (`height: auto; overflow: visible;`), allowing the modular chip cloud to expand naturally without nested scrollbars.
- **Card Alignment and Background Normalization:**
  - Removed redundant inner card background and borders in the spellchecker container to fuse seamlessly with the main card background.
  - Normalized container layout using `.download-management-row`, achieving perfect left-edge alignment with the headers and input controls of adjacent cards.

---

## [0.18.0] - 2026-09-03
### Added
- **Classic Doom Easter Egg in Isolated WASM View:**
  - Added "Doomizate" configuration card with toggle control in the About settings tab (disabled by default).
  - Integrated dynamic sidebar skull button (`<i class="fa-solid fa-skull"></i>`), located strictly between "Add Account" and "Report Bug", shown only when the toggle is active.
  - Implemented `#doom-view` containing an isolated `<webview>` running the WebAssembly port of Classic Doom (`https://diekmann.github.io/wasm-doom/`).
  - Added seamless tab switching with WhatsApp accounts, settings, and donations view without session interference.

---

## [0.17.11] - 2026-09-03
### Changed
- **Full License Migration to GNU GPL v3:**
  - Added official [`LICENSE`](LICENSE) file featuring the standard terms of the **GNU General Public License v3 (GPL v3)** with Sentinel Studio copyright.
  - Updated package configuration (`package.json`) to specify `"GPL-3.0-or-later"`.
  - Updated `README.md` with version badge (`v0.17.11`), GPL v3 license badge, and updated licensing section.
- **UI & Modal Modernization:**
  - Renamed About section license trigger to **"Licencia GNU GPL v3"**.
  - Refactored frontend source code (HTML, CSS, JS) to replace all legacy `mit` references with clean `gpl` identifiers (`gplModal`, `#btn-open-gpl-license`, etc.).
  - Updated modal popup dialog to showcase structured explanation of GNU GPL v3 copyleft provisions, freedoms, conditions, and warranty limitations across all 26 supported locales.

---

## [0.17.10] - 2026-09-03
### Changed
- **Fluid Horizontal Tag Layout for Spellchecker:**
  - Updated the spellchecker options container to use `display: flex; flex-wrap: wrap; gap: 10px;` allowing options to adapt dynamically as modular chips.
  - Re-styled spellchecker items with rounded corners, subtle borders, and smooth interaction states.
- **Dynamic Alphabetical Collation for Spellchecker:**
  - Implemented dynamic alphabetical sorting based strictly on the translated label currently viewed by the user via `.localeCompare()`.
- **Extended BCP-47 Regional Variants:**
  - Added exhaustive regional variants for Spanish, English, Portuguese, French, German, Italian, Russian, Arabic, Persian, and Asian languages.
- **Development Credits & Sentinel Studio Portal:**
  - Updated development copy to acknowledge Sentinel Studio and GitHub contributors, adding a direct button to `https://somossentinel.com/studio`.
- **Legal Disclaimer Notice:**
  - Appended an official multi-platform non-affiliation disclaimer to the About section across all 26 supported languages.

### Fixed
- **Transparent Background in MIT License Modal:**
  - Fixed modal card background using solid opaque theme-aware variables (`var(--bg-modal, var(--bg-sidebar, #111b21))`) ensuring crisp readability across light and dark themes.

---

## [0.17.9] - 2026-09-03
### Added
- **Multilingual Spellchecker with Checklist UI & Regional BCP-47 Variants:**
  - Redesigned the spellchecker selector into a multi-select checklist within a vertical scroll container (`max-height: 200px`).
  - Added support for 25 base languages and regional variants (Spanish: `es-ES`, `es-MX`, `es-AR`, `es-CO`; English: `en-US`, `en-GB`, `en-CA`, `en-AU`; Portuguese: `pt-BR`, `pt-PT`; French: `fr-FR`, `fr-CA`; German: `de-DE`, `de-AT`, `de-CH`; Chinese: `zh-CN`, `zh-TW`, `zh-HK`; Italian: `it-IT`; and base languages).
  - Visual format: `[Checkbox] [Emoji Flag] [Language Name] ([Variant/Region]) [BCP-47 Code]`.
  - Dynamic i18n support automatically translating language and regional variant names when switching interface language.
  - Concurrent multi-language spellchecking applied across `session.defaultSession` and all active webview sessions.
- **Automated Dictionary Disk Cleanup (`.bdic`):**
  - Integrated `removeDictionariesForLanguages` in the main process to detect unselected languages and safely delete physical compiled `.bdic` files from `userData/Dictionaries` and partition directories.
- **Native Modal Popup for MIT License (About View):**
  - Replaced the static MIT License badge with an interactive trigger opening a native DOM modal with backdrop blur (`backdrop-filter: blur(8px)`), thematic styling, and multiple dismiss options (close button, action button, backdrop click, Escape key).
- **Official ZapZap Project Repository Button (About View):**
  - Added a dedicated button in the Inspiration card linking directly to `https://github.com/rafatosta/zapzap` via secure IPC (`open-external-url`).

### Changed
- **Dynamic Tray Icon Style Selector Width:**
  - Updated CSS for `.setting-row-between .custom-select-wrapper` to `width: max-content; flex: 0 0 auto;`, allowing the dropdown to adapt smoothly to the length of the selected option while remaining pinned to the right edge.
- **Interface Language Card Restructuring:**
  - Modernized the Interface Language card into a horizontal Flexbox layout (`.setting-row-between`), featuring the descriptive label on the left and the language selector on the right.

### Fixed
- **Automatic Theme Mode System Synchronization:**
  - Resolved `nativeTheme.themeSource` locking in Electron, restoring dynamic query of OS dark/light mode preferences in `theme-auto`.
  - Integrated `nativeTheme.on('updated')` events to reactively synchronize UI appearance when the operating system switches color schemes.
- **Renderer SyntaxError Resolution:**
  - Fixed duplicate `electronAPI` declaration collision in `renderer.js`, restoring sidebar account rendering and navigation rail buttons.
- **Dynamic i18n Locale Resolution:**
  - Fully populated all 25 locale JSON files with complete dictionaries, eliminating unintended fallbacks to English.
- **Unified Download Directory Management:**
  - Connected IPC bridges (`selectFolder`, `getDefaultDownloadsPath`, `setDownloadPath`) and intercepted session downloads to ensure files save directly into user-configured paths.

### Removed
- **Privacy & Network Subsystem (Proxy & WebRTC Overrides):**
  - Completely removed proxy routing, strict isolation, and WebRTC manipulation overrides from the main process, preload scripts, and renderer, permanently eliminating Linux `SIGSEGV` segmentation faults and Chromium Network Service process restarts.

---

## [0.12.1] - 2026-09-03
### Added
- **Top 25 Worldwide Languages Localization:**
  - Expanded interface localization from 10 to the 25 most spoken languages in the world according to global speaker demographics (Ethnologue standard), sorted strictly in proportional order: English, Mandarin Chinese, Hindi, Spanish, French, Arabic, Bengali, Portuguese, Russian, Urdu, Indonesian, German, Japanese, Marathi, Telugu, Turkish, Tamil, Cantonese, Vietnamese, Filipino/Tagalog, Korean, Persian/Farsi, Hausa, Swahili, and Italian.
  - Complete, professional localization across all settings, tabs, dialogs, and navigation elements.
- **Granular Permissions Management:**
  - Added dedicated **Permisos** section in Settings with individual controls for hardware and sharing access: Microphone, Camera, Geolocation, Screen Sharing, and Screen Sharing with Audio.
  - Added quick action shortcuts: "Permitir todo" (Allow all) and "Quitar todo" (Remove all).
  - Configured native Electron session permission handlers to dynamically grant or deny permissions according to user preferences.
- **Advanced Notification Privacy Engine:**
  - Introduced customizable privacy presets: Broad, Medium, Strict, and Custom.
  - Fine-grained controls for Contact Photo, Contact Name, Message Preview, and Notification Sound.
  - Authoritative desktop notification interception via Electron's native notification subsystem with circular avatar masking.
  - Absolute Do Not Disturb (DND) isolation with hardware audio sink muting.
- **Multi-Brand Palette & Appearance Customization:**
  - Integrated 5 curated color palettes: WhatsApp (Emerald), Messenger (Meta Blue), Telegram (Cyan Blue), Signal (Royal Blue), and Forest (Olive & Earth), fully adaptive to both Light and Dark modes with WCAG AAA contrast ratio compliance.
  - Automatic guest theme synchronization ensuring WhatsApp Web matches the host appearance.
- **Enhanced Multi-Account Experience:**
  - Automatic WhatsApp profile name synchronization alongside contact avatar extraction (filtering out Meta AI icons).
  - Floating tooltip labels on sidebar accounts immune to container clipping.
  - Dedicated System Tray customization with unread message badge count and monochrome/colored icon variants.

---

## [0.5.4] - 2026-09-03
### Added
- **Stacer-Inspired Loading Splash Screen:** Introduced a dedicated frameless splash screen on application startup with an emerald glowing WhatsApp emblem, dynamic startup stage messages, and a smooth ~1.8s progress bar.
- **Pre-Warmed Window Transition:** Main application window initializes with background pre-rendering while the splash screen animates, ensuring an instantaneous, flicker-free presentation upon launch completion.
- **Dedicated Full-Window Settings View:** Redesigned the settings interface from a floating modal pop-up into a full-window view inside the workspace (`.main-content`), featuring tab-like switching, sidebar active indicator state, clean card groupings, and a "Back to chats" action.
- **Comprehensive Technical Documentation (`docs/`):** Created dedicated architectural and operational guides covering Architecture, Commit & Release Conventions, Session Isolation, Tab Hibernation & Memory Management, Diagnostics & Bug Reporting, Development & Maintenance, and QA Testing.
- **Documentation Governance Rule:** Enforced continuous documentation synchronization in `.agents/rules/documentation.md` and relative linking standards.

### Fixed & Improved
- **Wayland Color Management Fix:** Disabled Chromium's `WaylandWpColorManagerV1` feature flag in `src/main.js`, resolving image transfer and color space description errors on Linux Wayland environments (e.g., KDE Plasma 6 and GNOME).
- **Internationalization (i18n) Updates:** Extended translations for all new full-window settings labels, descriptions, and tooltips across all 10 supported languages (`en`, `es`, `hi`, `ar`, `bn`, `pt`, `ru`, `ur`, `id`, `fr`).

---

## [0.4.0] - 2026-09-03
### Added
- **Automated Bug Reporting:** Integrated one-click bug reporting directly from the titlebar, prepopulating a comprehensive diagnostics template on GitHub with system specifications and runtime information.
- **Strict Development Workflow:** Established isolated development on `Dev` branch with automated changelog tracking and neutral English documentation standards.

### Improvements & Fixes
- Consolidated resource management and debounced observers across all multi-account webviews.
- Upgraded documentation and development guidelines to neutral English.

---

## [0.3.0] - 2026-09-02
### Added
- **Resource Management & Hibernation:** Introduced intelligent memory management that automatically hibernates inactive accounts while maintaining real-time background notification listeners.
- **Performance Polish:** Optimized DOM observers and startup sequence to eliminate CPU spikes when running 5+ concurrent WhatsApp accounts.

---

## [0.2.0] - 2026-09-02
### Added
- **Multi-language Support:** Complete internationalization engine detecting OS language automatically with manual override options in preferences.

---

## [0.1.0] - 2026-09-02
### Added
- **Initial Desktop Interface:** Modernized tabbed multi-session architecture for WhatsApp Web with session partition isolation.
- **Account Identification:** Dynamic profile avatar and status sync on active tabs.
- **Settings System:** Account management and application preferences drawer.
