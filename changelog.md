# Changelog

All notable changes to the stable releases of WhatsNexus Desktop are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

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
