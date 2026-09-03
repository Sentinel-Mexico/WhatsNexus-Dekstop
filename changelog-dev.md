# Development Changelog (`changelog-dev.md`)

This changelog records all granular updates, bug fixes, refactorings, and feature iterations developed on the `Dev` branch. Each version bump in `package.json` is documented here as it happens.

---

## [0.12.4] - 2026-09-03
### Fixed
- **Permissions Module Title Capitalization:**
  - Capitalized the labels for the hardware access options under "Acceso al dispositivo" in `src/renderer/index.html` and across all dictionaries in `src/renderer/renderer.js` (`Micrófono` and `Cámara`, `Microphone` and `Camera`).

---

## [0.12.3] - 2026-09-03
### Fixed
- **Bilingual Language Label Formatting:**
  - Corrected language label formatting across all 25 language dictionaries to strictly follow `"{translated name in active language} ({native name})"`.
  - Injected complete 25x25 translation matrices so selecting any language (e.g. Spanish) renders options like `Inglés (English)`, `Chino Mandarín (中文 (普通话))`, `Francés (Français)`, instead of repeating the native name.

---

## [0.12.2] - 2026-09-03
### Fixed
- **Language Selector Dropdown Viewport Height (10 Items Max):**
  - Replaced native unconstrained OS `<select>` popup with a styled custom dropdown component (`.custom-select-wrapper`).
  - Constrained popup height strictly to `max-height: 380px` (`overflow-y: auto`), ensuring exactly 10 language options are visible at a time before vertical scrolling.
  - Added smooth scroll-to-selected behavior on open, click-outside auto-dismiss, and theme-adaptive scrollbar styling.

---

## [0.12.1] - 2026-09-03
### Fixed
- **Language Selector Population:**
  - Updated the top-level `supportedLanguages` array and `nativeNames` dictionary to include all 25 world languages in proportional ranking order, ensuring `populateLanguageSelect()` renders all 25 options in the interface selector.

---

## [0.12.0] - 2026-09-03
### Added
- **Top 25 Worldwide Languages Localization:**
  - Expanded internationalization from 10 to the 25 most spoken languages in the world according to global speaker demographics (Ethnologue standard), sorted strictly in proportional order of total speakers:
    1. English (`en`)
    2. Mandarin Chinese (`zh`)
    3. Hindi (`hi`)
    4. Spanish (`es`)
    5. French (`fr`)
    6. Modern Standard Arabic (`ar`)
    7. Bengali (`bn`)
    8. Portuguese (`pt`)
    9. Russian (`ru`)
    10. Urdu (`ur`)
    11. Indonesian (`id`)
    12. German (`de`)
    13. Japanese (`ja`)
    14. Marathi (`mr`)
    15. Telugu (`te`)
    16. Turkish (`tr`)
    17. Tamil (`ta`)
    18. Cantonese (`yue`)
    19. Vietnamese (`vi`)
    20. Filipino / Tagalog (`fil`)
    21. Korean (`ko`)
    22. Persian / Farsi (`fa`)
    23. Hausa (`ha`)
    24. Swahili (`sw`)
    25. Italian (`it`)
  - All 25 languages feature complete UI dictionaries translating every interface string across all settings tabs, alerts, sidebar components, and empty states.

### Changed
- **Permissions Section Refinement:**
  - Removed combined "Cámara y micrófono" option from the Device Access block in `#tab-permissions`.
  - Permissions are now purely granular and independent: Microphone, Camera, Location, Screen sharing, and Screen sharing with audio.
  - Native session handler in `src/main.js` now evaluates simultaneous media access (audio + video) by checking both independent permissions (`camera && microphone`).

---

## [0.11.0] - 2026-09-03
### Added
- **Permissions Management Section in Settings:**
  - Added new navigation tab: **Permisos** (`#tab-permissions`, `<i class="fa-solid fa-shield-halved"></i>`).
  - Added header notice banner explaining that disabled permissions will continue to be requested when required.
  - Added quick action buttons: **Permitir todo** (enables all permission switches) and **Quitar todo** (disables all switches).
  - Implemented **Acceso al dispositivo** block:
    - **micrófono:** Automatically grant microphone access.
    - **cámara:** Automatically grant camera access.
    - **Cámara y micrófono:** Automatically grant simultaneous access to camera and microphone.
    - **Ubicación:** Automatically grant geolocation access.
  - Implemented **Compartir** block:
    - **Compartir pantalla:** Automatically allow screen content sharing.
    - **Pantalla con audio:** Automatically allow screen sharing with system audio.
  - **Native Session Permissions Handler:** Integrated `session.setPermissionRequestHandler` and `session.setPermissionCheckHandler` in `src/main.js` to automatically grant or deny media, geolocation, and display-capture permissions based on user preferences.
  - **Full Internationalization (i18n):** Added 20 new localization keys translated across all 10 supported interface languages.

---

## [0.10.2] - 2026-09-03
### Fixed
- **Chromium Native Notification Permission Denial:**
  - Configured `setPermissionRequestHandler` and `setPermissionCheckHandler` across all Chromium sessions (`session.defaultSession` and dynamic partitions) to block native web notifications. This completely prevents Chromium's C++ NotificationPlatformBridge from dispatching un-filtered notifications directly to the OS.
  - WhatsNexus is now the sole authority controlling notification dispatch, ensuring DND and privacy filters are 100% strictly enforced.
- **Direct Main-World `window.Notification` Overwrite & ServiceWorker Disabling:**
  - Overrode `window.Notification` directly on the main world window (via `contextIsolation: false`), guaranteeing interception even before `document.documentElement` is populated.
  - Automatically unregisters and prevents new ServiceWorker registrations so WhatsApp Web consistently uses the intercepted `window.Notification` channel.
- **Synchronous Audio Muting on DND and Notification Settings Changes:**
  - Updated `applySettings()` and `toggleDND()` to dynamically synchronize `webview.setAudioMuted(isMuted)` across all webviews whenever DND or the notification sound toggle changes.

---

## [0.10.1] - 2026-09-03
### Fixed
- **Authoritative Notification Interception Architecture:**
  - Injected an inline main-world bridge script at document start to intercept `window.Notification` and `ServiceWorkerRegistration.prototype.showNotification` inside WhatsApp Web's execution context, eliminating context isolation bypass.
  - Intercepted notifications are routed to the host renderer (`src/renderer/renderer.js`), where account-level **Do Not Disturb (DND)** and privacy filters (**contact name**, **contact photo**, **message preview**, **notification sound**) are applied authoritatively before any alert reaches the operating system.
  - Notifications for accounts with DND enabled are dropped completely at the host layer.
- **Disk-Backed Circular Notification Avatars:**
  - Guest `<canvas>` circular-clipped PNG data is sent via IPC to the main process (`src/main.js`), where it is cached on disk and passed directly to Electron's native `Notification({ icon })` API.
  - Guaranteed 100% circular profile avatar rendering on Linux (`libnotify`), Windows, and macOS.

---

## [0.10.0] - 2026-09-03
### Added
- **Automatic Account Name Synchronization:** Automatically detects and syncs the user's authentic WhatsApp display name (`pushname` and profile drawer DOM) upon login, updating the account name in WhatsNexus without requiring manual typing (while gracefully preserving custom user renames).
- **Floating Sidebar Tooltip Bubbles:** Implemented a detached, floating tooltip bubble (`.sidebar-floating-tooltip`) that dynamically positions itself next to hovered account avatars in the left sidebar, overcoming scrollable overflow clipping.

### Fixed
- **Do Not Disturb (DND) Audio & ServiceWorker Leakage:**
  - Extended notification interception to `ServiceWorkerRegistration.prototype.showNotification` so background push notifications cannot bypass DND filters.
  - Implemented dual-layer audio muting: guest `HTMLAudioElement.prototype.play` blocking and Chromium host-level `<webview>.setAudioMuted(true)`.
- **Circular Notification Avatars on Blob URLs:** Resolved canvas tainting by restricting `crossOrigin = 'anonymous'` strictly to remote HTTP/HTTPS assets, allowing WhatsApp Web's memory-backed `blob:` notification icons to be cleanly exported to circular canvases.

---

## [0.9.0] - 2026-09-03
### Added
- **WhatsApp Web Theme Synchronization:** WhatsApp Web now automatically adopts dark or light mode based on WhatsNexus's active visual theme, combining Chromium-level `nativeTheme.themeSource`, guest DOM class injection, and `window.matchMedia` query mocking.
- **Account-level Do Not Disturb (DND) Enforcement:** When DND is toggled on an account, its guest `<webview>` actively suppresses and silences all desktop notifications dispatched by that specific WhatsApp account.
- **Circular Notification Avatars:** Contact profile photos attached to desktop notifications are dynamically clipped to a perfect circle via an HTML5 offscreen canvas prior to dispatch.
- **Enhanced Theme Contrast & Eye Comfort:** Optimized color palettes across all 10 theme variants (WhatsApp, Messenger, Telegram, Signal, Forest in dark and light modes), ensuring WCAG AAA compliant text contrast and soothing background luminance to minimize eye fatigue during extended use.

### Fixed
- **Profile Picture Extraction Filtering Meta AI:** Resolved an issue where the Meta AI header button was mistakenly extracted as the account's profile photo. Extraction now prioritizes authenticated user avatars (`pps.whatsapp.net` and profile header buttons) while explicitly rejecting Meta AI elements.

### Removed
- **Support Reminders Section:** Removed "Recordatorios de apoyo" from `#tab-notifications`.

---

## [0.8.0] - 2026-09-03
### Added
- **Notifications Panel Redesign & Custom Privacy Engine:**
  - Redesigned the `#tab-notifications` interface according to the user reference mockup.
  - Implemented Privacy Presets (**Amplio**, **Medio**, **Estricto**, and **Personalizado**) in an elevated dropdown selector.
  - Added granular switch toggles for individual control over:
    - **Notificaciones de escritorio:** Master switch with reactive dimming/disabling of secondary options.
    - **Foto de contacto:** Toggle sender profile avatar visibility.
    - **Nombre de contacto:** Toggle sender or group title visibility.
    - **Vista previa del mensaje:** Toggle incoming message snippet visibility.
    - **Sonido de notificación:** Toggle system sound alert.
  - Added secondary setting container: **Mensajes de WhatsNexus** $\rightarrow$ **Recordatorios de apoyo**.
  - **Dynamic Preset Sync:** Selecting a preset applies its switch configuration immediately; manually toggling any switch automatically transitions the active preset to **Personalizado**.
  - **In-flight Notification Interception:** `src/preload.js` dynamically wraps HTML5 `window.Notification` inside WhatsApp Web guest sessions, filtering sender metadata, avatars, message bodies, and alert sounds in real-time via IPC without requiring session reloads.
  - **Internationalization:** Added 21 new localization keys across all 10 supported languages.

---

## [0.7.2] - 2026-09-03
### Fixed
- **GLib Context Pop Assertion Warning on Shutdown:** Handled the `before-quit` application lifecycle event to explicitly destroy the System Tray (`tray.destroy()`) and release DBus/StatusNotifierItem bindings before Chromium dismantles the GLib main event loop, preventing `assertion 'stack != NULL' failed` warnings on Linux.

---

## [0.7.1] - 2026-09-03
### Fixed
- **System Tray Blank/Invisible Icon on Linux:** Fixed issue where in-memory SVG data URLs produced transparent or missing pixmaps on Linux `libappindicator`. The main process now directly serves disk-backed PNG icons (`tray-green.png`, `tray-light.png`, `tray-dark.png`, and their corresponding badge variants), ensuring 100% visibility and compatibility across GNOME, KDE, XFCE, Windows, and macOS.
- **Language Selector Empty / Unpopulated:** Resolved `ReferenceError: ipcRenderer is not defined` in `src/renderer/renderer.js` that interrupted renderer startup during `applySettings()`, allowing `updateTranslations()` and `populateLanguageSelect()` to execute and populate the language dropdown with all 10 supported languages.
- **Account Activation Switch Unresponsive / Stuck:**
  - Resolved `ipcRenderer is not defined` exception triggered upon toggling account status.
  - Upgraded the account activation control to an interactive modern switch toggle (`<label class="switch">`) with colored status badges (`Activada` / `Desactivada`) in both full and compact deactivated cards.

---

## [0.7.0] - 2026-09-03
### Added
- **Compact Cards for Deactivated Accounts:** When an account is deactivated, its settings card automatically collapses into a compact view displaying solely the avatar, account name, and activation toggle. Actions ("Editar", "Eliminar") and "No molestar" are hidden until the account is reactivated.
- **5 Multi-Palette Themes (Light & Dark Modes):**
  - **WhatsApp:** Emerald `#00a884`, `#202c33` / `#f0f2f5`.
  - **Messenger:** Meta Blue `#0084ff`, `#242526` / `#f0f2f5`.
  - **Telegram:** Telegram Cyan-Blue `#24a1de`, `#17212b` / `#f4f4f5`.
  - **Signal:** Signal Royal Blue `#2c6bed`, `#1b1c1e` / `#f6f7f9`.
  - **Bosque (Forest):** Dark Olive & Kombu `#606c38`, `#283618`, `#bc6c25`, `#fefae0`.
- **System Tray Integration:**
  - Close-to-tray behavior: Closing the main window minimizes to the tray, keeping sessions alive in the background without dropping notifications.
  - Clicking the tray icon restores or hides the application window.
  - Context menu with "Mostrar WhatsNexus" and "Salir" (clean app shutdown).
  - Dynamic unread message counter badge synthesized directly on the tray icon when unread messages arrive on active, non-muted accounts.
- **Appearance Settings Restructuring:**
  - Organized `#tab-appearance` into distinct, elevated `.setting-card` containers for: **Temas y Estilo Visual** (palette + mode), **Idioma de la Interfaz**, and **Bandeja del Sistema (Tray)** (icon style + unread badge toggle).
- **Internationalization:** Added 16 new localization keys across all 10 supported languages (`en`, `es`, `hi`, `ar`, `bn`, `pt`, `ru`, `ur`, `id`, `fr`).

---

## [0.6.0] - 2026-09-03
### Added
- **Account Activation & Deactivation System:** Added toggle to activate or deactivate individual WhatsApp accounts.
  - Deactivated accounts are removed from the sidebar and their `<webview>` is destroyed/hibernated from the DOM to free RAM and suppress notifications.
  - Persistent cache and authentication partitions (`persist:acc_<id>`) are safely preserved.
  - Re-enabling an account immediately restores it to the sidebar without requiring QR re-scanning.
- **Card-Style Account Management UI:** Redesigned the accounts list in Settings to match the reference design:
  - Header with avatar, account name display with inline editing toggle, and action buttons ("Editar", "Eliminar").
  - Row 1: Account status ("Estado de la cuenta") with segmented pill toggle ("Activada" / "Desactivada").
  - Row 2: Do Not Disturb ("No molestar") with modern switch slider.
- **Icon Updates:**
  - Main Settings icon updated to `fa-solid fa-gear`.
  - Account Management tab icon updated to `fa-solid fa-users-gear`.
- **Internationalization:** Added 9 new localization keys across all 10 supported languages (`en`, `es`, `hi`, `ar`, `bn`, `pt`, `ru`, `ur`, `id`, `fr`).

---

## [0.5.6] - 2026-09-03
### Fixed
- **Rendering Artifacts & Black/Beige Tile Corruption:** Resolved missing/stale rectangular tiles caused by GPU tile cache starvation and compositor surface detachment.
  - Replaced `display: none` tab toggling on `<webview>` containers with GPU-safe `visibility: hidden; opacity: 0; pointer-events: none;` and absolute positioning, keeping the Chromium guest renderer surfaces intact.
  - Removed `--enable-low-end-device-mode`, artificial `--renderer-process-limit=2`, `--disable-gpu-shader-disk-cache`, and overly restrictive V8 heap limits in `src/main.js` that starved Chromium's tile rasterizer on high-resolution/Wayland desktop environments.
  - Added card background and input contrast styling to `.settings-account-item` for visual consistency across themes.
- **Documentation:** Updated `docs/memory-and-performance.md` to detail viewport visibility management and remove deprecated low-end flags.

---

## [0.5.5] - 2026-09-03
### Added
- **Agent Rules Index (`.agents/README.md`):** Created a centralized index and reference guide for all active agent governance rules in `.agents/rules/`.
- **Rule Index Governance Requirement:** Updated `.agents/rules/documentation.md` (Section 5) to mandate immediate updates to `.agents/README.md` whenever rules are created, modified, or removed.

---

## [0.5.4] - 2026-09-03
### Added
- **Documentation Synchronization Rule (`.agents/rules/documentation.md`):** Mandated continuous synchronization of the `docs/` technical documentation whenever code changes, refactors, or feature additions impact documented behavior.
- **Relative Path Enforcement:** Converted all Markdown documentation links in `docs/README.md` to relative repository paths to ensure full portability on GitHub and local environments.

---

## [0.5.3] - 2026-09-03
### Added
- **Comprehensive Technical Documentation (`docs/`):** Established dedicated technical documentation covering Application Architecture (`architecture.md`), Commit & Release Conventions (`commit-convention.md`), Session Isolation & Partitions (`session-isolation.md`), Memory Management & Hibernation (`memory-and-performance.md`), Diagnostics & Bug Reporting (`reporting.md`), Development & Maintenance (`maintenance.md`), and Testing & QA (`testing.md`).
- **Main Documentation Index:** Added `docs/README.md` and linked documentation in root `README.md`.

---

## [0.5.2] - 2026-09-03
### Fixed
- **Wayland Color Management Error:** Disabled Chromium's `WaylandWpColorManagerV1` feature flag in `src/main.js` to eliminate `wayland_wp_color_manager` image transfer and color space description errors on Linux Wayland environments (such as KDE Plasma and GNOME).

---

## [0.5.1] - 2026-09-03
### Changed
- **Full-Window Settings Redesign:** Transformed the Settings interface from a floating modal pop-up into a dedicated full-window view inside the main content area (`.main-content`), integrating it directly alongside WhatsApp webview containers.
- **Tab-like Navigation Flow:** Sidebar Settings button now acts as a workspace tab with active indicator state, smoothly hiding active account webviews and presenting settings across the entire workspace. Selecting any account or clicking the "Back to chats" header button immediately restores the WhatsApp session.
- **Modern Settings Dashboard:** Structured settings into clean card-based groupings with dedicated sidebar navigation for Accounts, Appearance, and Notifications.
- **Internationalization (i18n) Expansion:** Added localized translations for all new full-window settings labels, hints, and navigation headers across all 10 supported languages.

---

## [0.5.0] - 2026-09-03
### Added
- **Stacer-Inspired Loading Splash Screen:** Introduced a dedicated frameless splash screen displayed on application startup. Features an emerald glowing WhatsApp emblem, dynamic startup stage messages, and a smooth ~1.8s progress bar.
- **Pre-warmed Window Transition:** The main window initializes with hidden rendering in the background while the splash screen animates, ensuring an instantaneous, flicker-free presentation upon launch completion.
- **IPC Lifecycle Synchronization:** Coordinated IPC signaling between splash renderer and Electron main process with a 4-second safety fallback.

---

## [0.4.0] - 2026-09-03
### Added
- **Bug Reporting System:** Automated bug report button in the titlebar opening a prefilled GitHub issue template with OS diagnostics, app version, Electron version, and active partition metadata.
- **Git Branching Workflow Rule:** Enforced isolated development on the `Dev` branch, preserving `main` strictly for stable releases.
- **English Documentation Rule:** Mandated neutral English for all project documentation, markdown files, and code comments.
- **Changelog Workflow Rule:** Established separation between `changelog-dev.md` (active development increments) and `changelog.md` (consolidated stable releases).

### Changed
- Translated `versioning.md` and repository `README.md` to neutral English.

---

## [0.3.1] - 2026-09-03
### Performance & Reliability
- **Startup Lazy Loading:** Deferred loading inactive tabs until user selection to reduce memory footprint on startup.
- **Debounced Preload Observers:** Debounced WhatsApp Web DOM mutation observers for avatar extraction and unread badges to minimize CPU utilization.
- **Partition Persistence Guarantee:** Ensured persistent storage partitions across all account sessions without credential loss.

---

## [0.3.0] - 2026-09-02
### Added
- **Tab Hibernation & Memory Optimization:** Automated unloading of idle background tabs to conserve system RAM, with instant state restoration upon tab focus.

---

## [0.2.1] - 2026-09-02
### Fixed
- **Language Selector Formatting:** Dynamically formatted native language names in settings dropdown for consistent presentation.

---

## [0.2.0] - 2026-09-02
### Added
- **Full Internationalization (i18n):** Multi-language architecture with automatic system locale detection and persistent manual override.

---

## [0.1.0] - 2026-09-02
### Added
- **Modern UI Redesign:** Revamped application interface with responsive layout and glassmorphism styling tokens.
- **Settings Panel:** Dedicated settings drawer for account management and interface preferences.
- **Profile Picture Extractor:** Automatic extraction of WhatsApp Web account avatar to display directly inside active tab buttons.
- **Semantic Versioning Rules:** Initialized project-wide SemVer guidelines in `.agents/rules/versioning.md`.
