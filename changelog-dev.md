# Development Changelog (`changelog-dev.md`)

This changelog records all granular updates, bug fixes, refactorings, and feature iterations developed on the `Dev` branch. Each version bump in `package.json` is documented here as it happens.

## [1.4.0] - 2026-09-05
### Security
- **Strict "Deny by Default" Session Permissions:**
  - Configured `session.setPermissionRequestHandler` and `session.setPermissionCheckHandler` in `src/main.js` to reject any unspecified or unexpected hardware capability requests by default (`callback(false)` and `return false`), permitting only explicitly configured user rules (Microphone, Camera, Location, Screen Share).
- **Chromium Process Sandboxing Enabled:**
  - Enforced `sandbox: true` across all application windows (`mainWindow` and `splashWindow`) in `src/main.js`.
  - Fortified `src/preload-main.js` to safely execute in sandboxed renderer environments with guarded system property accesses and updated fallback version.
- **Content Security Policy (CSP) Hardening:**
  - Eliminated `'unsafe-inline'` from `script-src` in `src/renderer/index.html` to mitigate cross-site scripting (XSS) vectors.
- **Safe External Navigation & URL Sanitization:**
  - Implemented `isSafeExternalUrl()` validation helper for `open-external` IPC event and `open-external-url` invoke channel in `src/main.js`.
  - Enforced strict filtering that blocks loopback addresses (`localhost`, `127.0.0.1`, `0.0.0.0`, `::1`), link-local IPs, and URLs containing embedded user credentials (`user:pass@host`).
  - Integrated `mainWindow.webContents.setWindowOpenHandler` using `isSafeExternalUrl` to prevent unauthorized popup window creation.

### Performance
- **Asynchronous Locale I/O with In-Memory Map Caching:**
  - Refactored `load-locale` IPC channel in `src/main.js` from synchronous file reads to non-blocking asynchronous I/O (`fs.promises.readFile` and `fs.promises.access`).
  - Added module-level `localeCache = new Map()` to eliminate disk I/O on repetitive language lookups and interface switching.
- **Zero-Disk In-Memory Notification Avatars:**
  - Refactored `show-native-notification` IPC handler in `src/main.js` to construct native images directly in RAM using `nativeImage.createFromDataURL(data.iconDataUrl)`.
  - Completely eliminated temporary avatar file writes (`fs.writeFileSync` to `avatar_notif_*.png`), avoiding disk thrashing and SSD wear during incoming message bursts.
- **Guest Preload Observer Optimization:**
  - Optimized `src/preload.js` inside WhatsApp Web to immediately clear the fallback `setInterval` polling loop (`clearInterval(intervalId); intervalId = null;`) as soon as `MutationObserver` triggers, saving background CPU cycles and battery.

### Documentation
- **Comprehensive Technical Documentation Suite Synchronization:**
  - Updated root `README.md` and all 8 documents in `docs/` (`docs/README.md`, `architecture.md`, `commit-convention.md`, `maintenance.md`, `memory-and-performance.md`, `reporting.md`, `session-isolation.md`, `testing.md`).
  - Synchronized documentation to reflect version `1.4.0`, full 55-language support (including conlangs Elvish Tengwar and Klingon pIqaD), 12-palette theme catalog, and Freedoom: Phase 1 BSD compliance.
  - Formally removed Snapcraft (`.snap`) from Linux distribution documentation, focusing Linux CI/CD on `.deb` and `.AppImage`.
  - Completely purged outdated Ko-fi references from architecture and donation documentation.
  - Documented the Version Quartet rule (`package.json`, `package-lock.json`, `README.md`, `changelog-dev.md`) in `docs/commit-convention.md`.

## [1.3.0] - 2026-09-05
### Added
- **New Theme Color Palettes (CSS Design Tokens):**
  - **Dracula:** Added Light Mode ("Alucard") (`--bg-primary: #F8F8F2`, `--bg-surface: #E6E6E6`, `--text-primary: #282A36`, `--accent-color: #BD93F9`) and Dark Mode ("Dracula Official") (`--bg-primary: #282A36`, `--bg-surface: #44475A`, `--text-primary: #F8F8F2`, `--accent-color: #BD93F9`).
  - **Nord:** Added Light Mode ("Snow Storm") (`--bg-primary: #ECEFF4`, `--bg-surface: #E5E9F0`, `--text-primary: #2E3440`, `--accent-color: #5E81AC`) and Dark Mode ("Nord Official") (`--bg-primary: #2E3440`, `--bg-surface: #3B4252`, `--text-primary: #ECEFF4`, `--accent-color: #88C0D0`).
  - **Star Wars:** Added Light Mode ("Jedi") (`--bg-primary: #F3F1E6`, `--bg-surface: #E8E5D5`, `--text-primary: #2C2A28`, `--border-color: #D1CEB8`, `--accent-color: #2E67F8`) and Dark Mode ("Sith") (`--bg-primary: #0A0A0A`, `--bg-surface: #1A1A1A`, `--text-primary: #E0E0E0`, `--border-color: #2A2A2A`, `--accent-color: #E52020`).
- **Dynamic Theme Switch Labels:**
  - Implemented `updateThemeLabels()` in `src/renderer/renderer.js` to dynamically mutate light/dark mode labels based on active palette:
    - "Alto Contraste" palette dynamically displays `"Día"` / `"Noche"` (`theme_day` / `theme_night`).
    - "Star Wars" palette dynamically displays `"Jedi"` / `"Sith"` (`theme_jedi` / `theme_sith`).
    - Standard palettes display default `"Claro"` / `"Oscuro"` (`theme_light` / `theme_dark`).
- **Internationalization (i18n) Leveling (312 Keys Total):**
  - Added full translation support across all 55 JSON files in `src/locales/` for the new and updated keys: `palette_retro`, `palette_steampunk`, `palette_highcontrast`, `palette_dracula`, `palette_nord`, `palette_starwars`, `theme_day`, `theme_night`, `theme_jedi`, and `theme_sith`.
  - Achieved 100% key parity with zero missing or untranslated keys across all 50+ world languages and conlangs (including Elvish Tengwar CSUR and Klingon pIqaD CSUR encodings).

### Changed
- **Theme Selector Color Descriptions:**
  - Standardized palette selector strings in `src/renderer/index.html` and localization files with concise parenthetical color descriptions:
    - `Retro (Beige y Neón)`
    - `Steampunk (Pergamino y Latón)`
    - `Alto Contraste (Blanco y Negro)`
    - `Dracula (Morado y Gris Oscuro)`
    - `Nord (Hielo y Escarcha)`
    - `Star Wars (Sable de Luz)`

### Fixed
- **Custom Dropdown Scrollbar Overflow & Border-Radius Containment:**
  - Applied `overflow: hidden;` to `.custom-select-options` and `.dropdown-menu` parent containers in `src/renderer/style.css` to enforce strict border-radius clipping.
  - Implemented nested `.custom-options-list` scroll container with `overflow-y: auto;` and internal padding/margins, ensuring scrollbar track and thumb remain fully contained within the menu boundaries without clipping rounded corners.

## [1.2.4] - 2026-09-05
### Fixed
- **Language Selector Conlang Native Glyph Rendering (Tengwar & Klingon pIqaD):**
  - Eliminated redundant parenthetical Latin descriptions for Elvish Tengwar (`"(Tengwar (Élfico / Elvish))"`) and Klingon (`"(tlhIngan Hol (Klingon / pIqaD))"`) in the interface language dropdown.
  - Formatted Tengwar selector labels to display authentic Tengwar Unicode PUA glyphs (`\uE000\uE042\uE012\uE00F\uE040\uE018`) mapped to `TengwarTelcontar.ttf` / `.woff2`.
  - Formatted Klingon selector labels to display authentic Klingon pIqaD CSUR Unicode PUA glyphs (`\uF8E4\uF8D7\uF8DC\uF8D0\uF8DB \uF8D6\uF8DD\uF8D9`) mapped to `Klingon-pIqaD.ttf` / `.woff2`.
  - Enclosed native glyphs within custom dropdown options and active trigger label in dedicated `<span>` wrappers styled with `.font-tengwar` and `.font-klingon` classes (`font-family: 'Tengwar' !important;` and `font-family: 'Klingon pIqaD' !important;`).
  - Added `'Tengwar'` and `'Klingon pIqaD'` to the primary global `font-family` CSS fallback stack on `body`, `select`, `.styled-select`, `.custom-select-trigger`, `.custom-select-options`, and `.custom-option` to guarantee seamless fallback rendering across both custom visual dropdowns and native select elements.

## [1.2.3] - 2026-09-05
### Fixed
- **Comprehensive Internationalization (i18n) Leveling & Fallback Elimination:**
  - Audited all 55 JSON localization files in `src/locales/` against `en.json` as the single canonical Source of Truth (305 keys).
  - Resolved English fallback leakage across all foreign language files, providing complete native translations for navigation labels, settings tabs, Appearance options, "About" tab headers, interface language pickers, auto-updater alerts, offline/reconnection dialogs, proxy isolation controls, and Freedoom WebAssembly overlay controls.
  - Achieved comprehensive translation coverage across major languages (Hindi `hi.json`, Arabic `ar.json`, Russian `ru.json`, Telugu `te.json`, Japanese `ja.json`, Bengali `bn.json`, Urdu `ur.json`, Persian `fa.json`, Korean `ko.json`, Marathi `mr.json`, Tamil `ta.json`, Vietnamese `vi.json`, Indonesian `id.json`, Thai `th.json`, Dutch `nl.json`, Polish `pl.json`, Ukrainian `uk.json`, Romanian `ro.json`, Turkish `tr.json`, Esperanto `eo.json`, and all regional dialects).
  - Verified 100% key parity (exactly 305 keys in all 55 locale files) and confirmed zero orphaned English strings in critical interface elements.

## [1.2.2] - 2026-09-05
### Fixed
- **Deduplication of Klingon in Language Selector:**
  - Resolved duplicate Klingon dropdown entries in `src/renderer/renderer.js` by removing redundant `'klingon'` from `supportedLanguages` and `nativeNames`, preserving solely the canonical ISO 639-2/3 `'tlh'` entry (`"tlhIngan Hol (Klingon / pIqaD)"`).
  - Added seamless backward-compatibility normalization converting existing stored settings with `language: 'klingon'` to `'tlh'`.
- **Authentic Conlang Transliteration & Glyphic Encoding (Elvish Tengwar & Klingon pIqaD):**
  - Eliminated English fallback placeholders in `src/locales/tlh.json` (and synchronized `src/locales/klingon.json`) by encoding authentic Klingon canon vocabulary (Okrandian tlhIngan Hol) into the ConScript Unicode Registry (CSUR) Private Use Area (`U+F8D0`–`U+F8FF`) required by `Klingon-pIqaD.ttf` to render native pIqaD glyphs.
  - Replaced English strings in `src/locales/tengwar.json` with genuine Elvish transliteration mapped to the CSUR code points (`U+E000`–`U+E07D`) expected by `TengwarTelcontar.ttf`.
  - Maintained complete key parity across all 305 locale keys for both conlang dictionaries.

## [1.2.1] - 2026-09-05
### Refactored & Optimized
- **Complete Internationalization (i18n) Architecture Audit & Asset Synchronization:**
  - Audited `src/locales/` directory and expanded coverage to all top 50 most spoken world languages (including Punjabi, Javanese, Wu Chinese, Gujarati, Thai, Bhojpuri, Southern Min, Hakka, Jin Chinese, Polish, Pashto, Kannada, Malayalam, Sundanese, Odia, Burmese, Ukrainian, Sindhi, Romanian, Dutch, Amharic, Yoruba, Oromo, Uzbek, and Malay) plus constructed languages (Esperanto `eo.json`, Tengwar `tengwar.json`, and Klingon `klingon.json` / `tlh.json`), reaching 55 localized dictionary files.
  - Enforced 100% key parity across all 55 JSON files (305 identical keys per locale file) with `en.json` serving as the single canonical source of truth.
  - Expanded `supportedLanguages` and `nativeNames` in `src/renderer/renderer.js` to register all 50 global languages and conlangs in the language selection dropdown with native typography.
- **Strict User Interface String Extraction (Zero-Hardcoding Enforcement):**
  - Inspected and sanitized all UI markup in `src/renderer/index.html`, replacing hardcoded text with `data-i18n`, `data-i18n-title`, and `data-i18n-aria` attributes:
    - Sidebar action buttons: `data-i18n-aria` for Add Account, Freedoom, Report Bug, Donations, and Settings.
    - Custom dropdown trigger labels: `palette-select-label`, `theme-select-label`, `tray-style-select-label`, and `privacy-preset-select-label`.
    - Form inputs: `download-path-input` placeholder mapped to `data-i18n="download_path_placeholder"`.
    - License button tooltip: `btn-open-gpl-license` title mapped to `data-i18n-title="view_gpl_license_title"`.
    - Modal dialogs: close buttons mapped to `data-i18n-aria="btn_close"`.
  - Refactored `src/renderer/renderer.js` to eliminate embedded Spanish fallback strings across dynamic dialogs, tooltips, hidden notification masking (`notif_hidden_contact`, `notif_hidden_message`), version label formatting (`about_version_label`), and auto-updater button states.
  - Localized the Freedoom easter egg webview (`src/assets/doom/index.html`), extracting controls overlay strings, button titles, and loading indicators into reactive `data-i18n` bindings fed via URL query parameter and local JSON fetch.
- **Agent Governance & Architectural Policy:**
  - Authored `.agents/rules/i18n.md` codifying strict zero-hardcoding rules, 100% locale key parity mandate, single-source-of-truth guidelines in `src/locales/`, and language registration procedures for all future agent tasks.

## [1.2.0] - 2026-09-05
### Added
- **Conlang Custom Typography Architecture (Elvish Tengwar & Klingon pIqaD):**
  - Added dedicated fonts directory at `src/assets/fonts/` for local asset distribution.
  - Downloaded official "Tengwar Telcontar" font (`TengwarTelcontar.ttf` and optimized `TengwarTelcontar.woff2`) from the Free Tengwar Font Project.
  - Downloaded official "Klingon pIqaD" font (`Klingon-pIqaD.ttf` and optimized `Klingon-pIqaD.woff2`) from the Klingon Language Institute / Evertype CSUR archive.
  - Declared local `@font-face` rules in `src/renderer/style.css` for `'Tengwar'` and `'Klingon pIqaD'` with WOFF2 and TrueType format fallbacks.
  - Implemented dynamic attribute selectors (`html[data-language="tengwar"]`, `html[data-language="klingon"]`, `html[data-language="tlh"]`) targeting `body`, `button`, `input`, `select`, and `textarea` with `!important` font family enforcement.
  - Added full locale dictionaries for `src/locales/tengwar.json` and `src/locales/klingon.json`.
  - Expanded `supportedLanguages` and `nativeNames` in `src/renderer/renderer.js` to register Tengwar and Klingon in the language selection dropdown with respective native naming.
  - Updated `loadActiveLocale`, `updateTranslations`, and `applySettings` in `src/renderer/renderer.js` to dynamically synchronize `data-language` and `lang` on the root `<html>` element upon language selection or application launch.

## [1.1.1] - 2026-09-05
### Fixed
- **Palette Selector Streamlining & Redundant Variant Clean Up:**
  - Removed duplicate individual mode entries ("Retro Computing (Modo Claro)", "Synthwave Terminal (Modo Oscuro)", "Victorian Parchment (Modo Claro)", "Brass & Boiler (Modo Oscuro)", "High Contrast Day (Modo Claro)", "High Contrast Night (Modo Oscuro)") from the Appearance color palette dropdown in `src/renderer/index.html`.
  - Consolidated palette options strictly to primary theme families (`whatsnexus`, `whatsapp`, `messenger`, `telegram`, `signal`, `forest`, `retro`, `steampunk`, `highcontrast`), allowing the global Light/Dark mode switch to dynamically resolve the respective formal sub-themes ("Retro Computing" / "Synthwave Terminal", "Victorian Parchment" / "Brass & Boiler", "High Contrast Day" / "High Contrast Night").
  - Simplified change event listener and sanitized legacy stored sub-values in `src/renderer/renderer.js`.
  - Cleaned up redundant alias selectors in `src/renderer/style.css` and locale dictionary keys in `src/locales/en.json` and `src/locales/es.json`.

## [1.1.0] - 2026-09-05
### Added
- **Theme System Expansion (Retro, Steampunk & High Contrast Palettes):**
  - Integrated 3 complete theme families across global CSS design tokens with formal light and dark variants:
    - **Retro Theme:** "Retro Computing" (Light: beige hardware `#E8E4D9`, surface `#DCD7C9`, Commodore blue `#2B5C8F`) and "Synthwave Terminal" (Dark: night CRT `#12131C`, surface `#1A1C2B`, Synthwave neon pink `#FF71CE`, neon cyan `#01CDFE`).
    - **Steampunk Theme:** "Victorian Parchment" (Light: parchment `#F4EBD9`, surface `#E8DEC8`, aged copper `#A45A2A`) and "Brass & Boiler" (Dark: cast iron `#1A1614`, surface `#26201C`, burnished brass `#C98E34`).
    - **High Contrast Theme (WCAG AAA):** "High Contrast Day" (Light: pure white `#FFFFFF`, surface `#F0F0F0`, pure black `#000000`, cobalt blue `#00318C`) and "High Contrast Night" (Dark: OLED black `#000000`, surface `#0D0D0D`, pure white `#FFFFFF`, safety yellow `#FFE600`).
  - Added semantic CSS tokens (`--bg-surface`, `--accent-color`, `--accent-hover`, `--text-on-accent`) ensuring WCAG AAA legibility and contrast across all theme switches.
  - Integrated full options into the Appearance settings selector (`palette-select`), enabling seamless switching between theme families and direct variants with persistent storage in `localStorage`.
  - Added internationalization keys for English and Spanish palettes across UI dropdowns.

### Changed
- **Donation Channels & Support View Overhaul:**
  - Updated PayPal donation link to direct to `https://paypal.me/stlmexico`.
  - Configured GitHub Sponsors destination to redirect to the official repository `https://github.com/Sentinel-Mexico/WhatsNexus-Dekstop`.
  - Completely removed Ko-fi button, card, and interface styling from the donations view.

## [1.0.6] - 2026-09-05
### Security & Compliance
- **Easter Egg IWAD Audit & Proprietary Asset Removal:**
  - Audited `src/assets/doom/` and identified proprietary `doom1.wad` (id Software / ZeniMax Media 1993 shareware data).
  - Completely purged `doom1.wad` from disk and git tracking to mitigate any risk of copyright or intellectual property infringement.
- **Migration to Freedoom: Phase 1 (Open Source IWAD):**
  - Integrated official `freedoom1.wad` (Freedoom Phase 1 v0.13.0) licensed under the permissive BSD 3-Clause license compatible with GPL v3.
  - Updated WebAssembly Emscripten glue in `src/assets/doom/index.html` to mount `/freedoom1.wad` into the virtual MEMFS with arguments `-iwad freedoom1.wad` and expanded initial memory to 128 MB (`INITIAL_MEMORY: 134217728`).
  - Updated asset download script `scripts/download-doom.js` to automatically verify Freedoom Phase 1 and clean up legacy or proprietary assets.

### Fixed & Changed
- **Engine Controls Remapping & Modern Dark Theme Overlay:**
  - Remapped engine keybindings in `src/assets/doom/default.cfg` and `src/assets/doom/index.html` to standard action mappings: Movement (`W, A, S, D` and arrow keys), Camera steering (mouse look and `O` / `P`), Fire (`Ctrl` and Left Mouse Click), Interact / Open doors (`Spacebar`, with synthetic `E` key fallback), Run (`Shift`), and Weapon selection (`1 - 7`).
  - Modernized the floating controls panel header to display "Controles de Freedoom" with refined WhatsNexus dark theme styling and responsive layout.

## [1.0.5] - 2026-09-05
### Fixed
- **Linux CI/CD Workflow & Target Streamlining:**
  - Removed `snapcraft` from the Ubuntu APT package installation list in `.github/workflows/build.yml`, eliminating runner package acquisition failure on Ubuntu 24.04 (`noble`).
  - Adjusted electron-builder Linux targets to generate `.deb` and `.AppImage` packages (`--linux deb AppImage`) for both x64 and arm64 architectures.
  - Updated author contact email to `studio@somossentinel.com` across package metadata.

## [1.0.4] - 2026-09-05
### Fixed
- **Linux Packaging Metadata (.deb Specification):**
  - Configured structured `author` object with institutional name and email (`"Sentinel Studio <studio@sentinelstudio.com>"`) in `package.json` to satisfy Debian package maintainer email specifications.
- **Linux Snapcraft Runner Dependency:**
  - Added `snapcraft` package to the APT installation step in `.github/workflows/build.yml` on Ubuntu runners, resolving the `ENOENT` process execution failure during multiplatform Linux release jobs.

## [1.0.3] - 2026-09-04
### Fixed
- **DOOM Controls Overlay Accuracy & Interaction Enhancements:**
  - Updated the floating controls card in `src/assets/doom/index.html` to accurately reflect engine keybindings: firing mapped to Spacebar and Left Click, and door interaction/activation mapped to `E`.
  - Added horizontal camera rotation mappings to the controls overlay, clarifying that steering can be achieved via mouse horizontal motion or keyboard keys `O` (turn left) and `P` (turn right).
  - Added an informational note regarding classic DOOM (1993) level design mechanics where vertical jumping does not exist in the original vanilla engine.
  - Enabled browser pointer lock (`canvas.requestPointerLock()`) on canvas click, providing continuous 360-degree mouse look and seamless keyboard focus.

## [1.0.2] - 2026-09-04
### Fixed
- **Classic Doom WebAssembly Engine Execution & Black Screen Resolution:**
  - Resolved the startup freeze / black screen issue in the Chocolate Doom WebAssembly launcher by passing the `-nomusic` parameter in `commonArgs`, preventing the Emscripten runtime from deadlocking when attempting to initialize MIDI audio hardware without native soundfont backends.
  - Enhanced canvas interaction handling in `src/assets/doom/index.html` by adding explicit click focus listeners, ensuring immediate capture of keyboard events upon user interaction.
### Changed
- **CI/CD Ubuntu 24.04 Multiarch Deb822 Repository Isolation:**
  - Updated `.github/workflows/build.yml` with deb822 source list isolation for Ubuntu 24.04 (`noble`) runners, ensuring ARM64 cross-compilation toolchains pull exclusively from `ports.ubuntu.com` and prevent architecture collisions with `archive.ubuntu.com`.
- **Governance Rules Enforcement & Version Triad Parity:**
  - Updated behavioral rules in `.agents/rules/` and governance index in `.agents/README.md` to mandate push to `Dev` on every version change, strict triad synchronization (`changelog-dev.md`, `package.json`, `package-lock.json`), and English-only policy across all code notes and text files.

## [1.0.1] - 2026-09-04
### Changed
- **Governance & Version Synchronization Triad Enforcement:**
  - Standardized agent behavioral rules in `.agents/rules/changelog.md` and `.agents/rules/versioning.md` establishing a mandatory version triad rule (`changelog-dev.md`, `package.json`, `package-lock.json`).
  - Formalized automatic lockfile verification (`npm install --package-lock-only`) to guarantee strict version parity across dependencies and metadata prior to every commit.
  - Updated repository governance documentation index in `.agents/README.md` to reflect production milestone policies and lockfile synchronization protocols.
### Performance
- **Optimization & Script Execution Safeguards:**
  - Optimized package management routines and streamlined lockfile updates to guarantee swift, deadlock-free dependency verification.

## [1.0.0] - 2026-09-04
### Added
- **Official Stable Production Release (Out of Beta):**
  - Officially concluded the initial beta development phase and promoted WhatsNexus to its first production-grade milestone (`1.0.0`).
  - Consolidated complete documentation suite across `README.md` and `docs/` reflecting all production capabilities, architectures, and testing matrices.
- **Comprehensive Auto-Updater Architecture (OTA Updates):**
  - Integrated `electron-updater` and `electron-log` targeting GitHub Releases (`Sentinel-Mexico/WhatsNexus-Dekstop`).
  - Added interactive visual state machine in the "About" settings module with manual update checks, live percentage readouts, and one-click install/restart workflows.
- **Offline Protection & Automatic Network Reconnection Subsystem:**
  - Implemented container-level offline screens with visual status badges and retry actions on network load failure (`did-fail-load`).
  - Added global high-z-index `#reconnecting-modal` preventing accidental chat manipulation during network loss, with reactive auto-reconnect on `online` events.
- **Cloudflare Doom-Wasm Port Migration with Audio & Overlay:**
  - Migrated Classic Doom Easter Egg to Cloudflare's Chocolate Doom WebAssembly engine running completely offline.
  - Solved resource loading deadlocks via concurrent `fetch()` and direct virtual filesystem population (`FS.createDataFile`).
  - Added `--autoplay-policy=no-user-gesture-required` and explicit WebAudio unlocking for instant sound.
  - Built dark-themed floating controls overlay card with collapsible toggle.
- **Official Typography Migration to Google Fonts "Poppins":**
  - Adopted Poppins font family globally across main interface, splash screen, and Doom launcher.
- **Official WhatsNexus Brand Palette & Visual Identity:**
  - Configured default WhatsNexus color scheme (dark & light variants) engineered for long-session readability and visual comfort.
- **Multiplatform CI/CD Pipeline (`.github/workflows/build.yml`):**
  - Configured automated GitHub Actions matrix producing `.deb`, `.AppImage`, `.snap` (x64/arm64), `.dmg` (x64/arm64), and `.exe` (NSIS x64).
- **Account Deletion Safety Dialog:**
  - Added modal confirmation `#delete-account-modal` preventing accidental account and session purges.

## [0.21.1] - 2026-09-04
### Added
- **Cloudflare Doom-Wasm Port Migration & Audio Pipeline Fixes:**
  - Migrated Classic Doom Easter Egg to Cloudflare's official Chocolate Doom WebAssembly port (`cloudflare/doom-wasm`).
  - Integrated local engine assets into `src/assets/doom/`: `websockets-doom.js`, `websockets-doom.wasm` / `doom.wasm`, `default.cfg`, and shareware `doom1.wad`.
  - Added `--autoplay-policy=no-user-gesture-required` Chromium command line switch in `src/main.js` before `app.whenReady()` to prevent WebAudio autoplay policy restrictions.
  - Implemented explicit `AudioContext` unlocking logic in Doom's `index.html` on first keydown, mousedown, or touch event, immediately resuming any suspended contexts across WebAudio and Emscripten SDL2.
  - Designed and implemented a floating, semi-transparent controls overlay card in the top-right corner of the Doom view styled with WhatsNexus dark theme aesthetics:
    - Lists Chocolate Doom keybindings: Movement (Arrows or W/A/S/D), Fire (Ctrl or Left Click), Open/Interact (Space), Run/Speed (Shift), Change Weapon (1-7).
    - Includes a collapsible/expandable chevron toggle button allowing users to hide controls for an unobstructed gameplay view.
  - Purged redundant legacy files (`doom.js` and duplicated `doom.wasm`), optimizing offline payload exclusively to Cloudflare's `websockets-doom.wasm`, `websockets-doom.js`, `default.cfg`, and `doom1.wad`.
  - Resolved resource loading deadlock ("Cargando recursos... (2/4)") by replacing legacy Emscripten XHR preloading with robust concurrent modern `fetch` and direct virtual filesystem population (`FS.createDataFile`), achieving instant engine initialization.
- **Automated Multiplatform CI/CD Pipeline (`.github/workflows/build.yml`):**
  - Created GitHub Actions workflow `.github/workflows/build.yml` configured to execute strictly on pushes to `main` and release tags (`v*`).
  - Implemented multiplatform build matrix across `ubuntu-latest`, `windows-latest`, and `macos-latest` leveraging `samuelmeuli/action-electron-builder@v1` with `${{ secrets.GITHUB_TOKEN }}`.
  - Configured Linux ARM64 multiarch cross-compilation toolchains (`gcc-aarch64-linux-gnu`, `g++-aarch64-linux-gnu`, `snapcraft`) producing `.deb`, `.AppImage`, `.snap` (x64 and arm64), macOS `.dmg` (x64 and arm64), and Windows NSIS `.exe` (x64).
- **Global Typography Migration to Google Fonts "Poppins":**
  - Adopted Google Fonts "Poppins" as the official typography across WhatsNexus.
  - Integrated Poppins font links (weights 300, 400, 500, 600, 700) with preconnect directives in `src/renderer/index.html` and `src/splash/splash.html`.
  - Updated global `font-family` styles across `src/renderer/style.css` and `src/splash/splash.css`.

## [0.21.0] - 2026-09-03
### Added
- **Comprehensive Offline Protections & Network Reconnection Architecture:**
  - **Account Offline Screen:** Implemented dedicated `.offline-overlay` displayed inside individual account containers when the app is launched offline or when a webview encounters a network loading failure (`did-fail-load`). Displays offline status iconography, clear explanatory text, and an interactive "Reintentar" / "Retry" button that attempts reconnection with visual loading feedback.
  - **Active Disconnection Reconnecting Overlay:** Introduced `#reconnecting-modal` with high z-index backdrop that activates automatically if network connectivity drops while using the application. Completely blocks accidental interactions across accounts, displays a spinning progress indicator, pulse badge, and reconnecting status message.
  - **Seamless Auto-Reconnection:** Integrated reactive listeners (`window.addEventListener('online')` and verification ping) that automatically dismiss the reconnecting modal and reloads any account webviews showing the offline screen once the network connection is restored.
  - **Full Internationalization:** Added localization tokens across all 26 supported languages (`offline_screen_title`, `offline_screen_desc`, `btn_retry`, `status_connecting`, `reconnecting_title`, `reconnecting_desc`, `reconnecting_status`).

## [0.20.1] - 2026-09-03
### Added
- **Offline & Responsive Native WebAssembly Doom:**
  - Implemented a 100% self-contained, offline port of Classic Doom running locally under `src/assets/doom/`.
  - Added native assets: `index.html`, JavaScript engine runner `doom.js`, WebAssembly binary `doom.wasm`, and Shareware IWAD `doom1.wad`.
  - Added automated retrieval script `scripts/download-doom.js` registered under `npm run download-doom` and `postinstall` in `package.json`.
  - Configured full-stretch responsive CSS for canvas (`100vw`/`100vh`, `object-fit: contain`, flex centering) eliminating borders and external network latency.
  - Updated `<webview id="doom-webview">` in `index.html` and `renderer.js` to point directly to local `../assets/doom/index.html`.
- **Account Deletion Confirmation Dialog:**
  - Added modal popup `#delete-account-modal` in account management view to prevent accidental account deletions.
  - Displays the targeted account name with danger iconography, warning message, and clear "Cancel" / "Delete" actions.
  - Integrated keyboard accessibility (Escape key dismiss) and backdrop click dismissal.
  - Added localization keys across all 26 supported languages (`modal_delete_account_title`, `modal_delete_account_msg`, `btn_confirm_delete`, `btn_cancel`).

## [0.20.0] - 2026-09-03
### Added
- **Complete Auto-Updater Architecture (OTA Updates via `electron-updater`):**
  - Integrated `electron-updater` and `electron-log` for automated GitHub releases and background update verification.
  - Configured `electron-builder` `publish` metadata in `package.json` pointing to `Sentinel-Mexico/WhatsNexus-Dekstop` on GitHub.
  - Configured manual update flow via `autoUpdater.autoDownload = false;` to guarantee explicit user agency before downloading updates.
  - Implemented secure IPC handlers in main process (`check-for-updates`, `download-update`, `install-update`) with fallback error handling.
  - Forwarded real-time updater events (`update-available`, `update-not-available`, `download-progress`, `update-downloaded`, `update-error`) to the renderer via `mainWindow.webContents.send`.
  - Safely exposed updater methods and event listeners under `window.electronAPI.updater` via `contextBridge` in `preload-main.js`.
- **Interactive Update UI & State Machine in "About" View:**
  - Added modern `#btn-update` action button directly beneath the version badge in the "About" section header card.
  - Implemented a resilient UI state machine in `renderer.js`:
    - **Idle State:** Displays "Buscar actualizaciones" / "Check for updates" (interactive).
    - **Checking State:** Calls `check-for-updates`, transitions to "Buscando..." / "Checking..." with a spinner (disabled).
    - **Up-to-Date State:** Informs user with "Tienes la última versión" / "You have the latest version" and automatically reverts to Idle.
    - **Update Available State:** Highlights button with "Actualización disponible: Descargar ahora" / "Update available: Download now".
    - **Downloading State:** Calls `download-update`, disables button with live percentage readout, and reveals a sleek dual-gradient animated progress bar.
    - **Downloaded State:** Emphasizes action button in vibrant emerald green with "Instalar y Reiniciar" / "Install & Restart" triggering `quitAndInstall()`.
    - **Error State:** Gracefully displays error indicator and reverts to Idle without crashing.
  - Added localization strings across all 26 supported languages (`src/locales/*.json`).
- **Feature Comparison Matrix in Documentation:**
  - Added a comprehensive, side-by-side feature comparison table in `README.md` contrasting WhatsApp Web, ZapZap, and WhatsNexus across 19 functional criteria (session isolation, multi-account tabs, notification privacy presets, tray unread badges, memory hibernation, theme engine, OTA updates, and open-source licensing).

## [0.19.0] - 2026-09-03
### Added
- **Official "WhatsNexus" Flagship Color Palette (Default Preset):**
  - Designed and introduced the official "WhatsNexus" brand color palette as the default appearance across the application, replacing generic themes.
  - Implemented both Dark Mode (`body.palette-whatsnexus` / `:root`) and Light Mode (`body.palette-whatsnexus.theme-light` / `body.theme-light`) variants, engineered specifically for high contrast, WCAG AAA accessibility, and prolonged visual ergonomics without eye strain.
  - Core palette tokens derived from official brand swatches:
    - Primary Action / Accent: `#4C9E5F` (vibrant emerald green) with hover `#3d834e`
    - Secondary Accent / Badges: `#6E9E4C` (moss green)
    - Warm Accent / Highlights: `#9E624C` (terracotta)
    - Alert / Crimson Accent: `#9E4C53` (rose crimson)
    - Dark Canvas & Slate: `#151c17` canvas with `#1e2922` sidebar and panels, derived from deep pine `#3B493F`
    - Light Canvas & Neutral: `#f3f6f4` canvas with `#ffffff` card surfaces and `#152219` high-contrast typography
  - Added `<option value="whatsnexus" data-i18n="palette_whatsnexus">WhatsNexus</option>` as the first option in Settings > Appearance, localized across all 26 supported languages (`src/locales/*.json`).
  - Preserved the classic "WhatsApp (Emerald)" palette as a dedicated selectable option (`palette-whatsapp`).

### Changed
- **Splash Screen Cohesive Brand Identity:**
  - Modernized the splash loading window styling (`splash.css`) to align with the new WhatsNexus color scheme.
  - Upgraded card background to deep pine gradient (`#1e2922` to `#131a15`), ambient radial glow and pulse animations to `#4C9E5F`, and progress track fill to a vibrant dual-gradient (`#6E9E4C` to `#4C9E5F`).
  - Adjusted typography colors to high-contrast pine-tinted hues (`#edf4ef`, `#9cb0a2`, `#d6e3d9`).
- **Codebase Internationalization & Agent Rules Alignment:**
  - Translated all internal code comments, annotations, and documentation from Spanish to professional English across `main.js`, `renderer.js`, and markdown documentation files.
  - Updated agent rules (`.agents/rules/changelog.md` and `branching.md`) to formally enforce that `changelog.md` is reserved strictly for stable releases merged to `main`, while `changelog-dev.md` tracks all granular development changes and triggers immediate synchronization to `origin/Dev`.

### Fixed
- **Classic Doom WebAssembly Demo 404 Resolution:**
  - Updated the Doom port URL in `openDoomView()` from the decommissioned `https://diekmann.github.io/wasm-doom/` to the official live WebAssembly demo endpoint at `https://diekmann.github.io/wasm-fizzbuzz/doom/`.

---

## [0.18.3] - 2026-09-03
### Fixed
- **Doom Webview Rendering & Memory Lifecycle:**
  - Resolved a DOM nesting defect in `index.html` where `#doom-view` was inadvertently placed inside the `#donations-view` element, eliminating inherited `hidden`, `opacity: 0`, and `z-index: -1` states.
  - Applied full-window flex layout rules to `#doom-view` and `#doom-webview` (`display: flex; flex: 1; width: 100%; height: 100%; border: none;`).
  - Optimized memory usage by dynamically instantiating/loading the WebAssembly port only upon opening the view, and resetting the webview source to `about:blank` when the "Doomizate" toggle is disabled.
- **Descriptive Subtitles in About Tab:**
  - Added secondary subtitle descriptions (`.perm-group-desc`) beneath each card header in the About view ("WhatsNexus Version", "License and Repositories", "Credits and Acknowledgements", and "Doomize").
  - Injected corresponding localized strings across all 26 language files in `src/locales/`.
- **Redundant Language Codes Cleanup (Spellchecker):**
  - Strictly removed ambiguous redundant language codes `"es"`, `"fr"`, `"de"`, `"it-IT"`, and `"ru-RU"` from the available spellchecking catalog in favor of precise regional codes and unified root entries (`it`, `ru`).
  - Added an automatic migration layer in both renderer and main process to remap legacy persisted codes to their current equivalents without UI errors or empty chips.

---

## [0.18.2] - 2026-09-03
### Changed
- **Official WhatsNexus Brand Identity & Icons Refresh:**
  - Regenerated master application icons and system tray assets (`src/assets/`) from official vector source files:
    - `icon.png` (256x256) & `tray-green.png` (64x64) generated from `whatsnexus-logo.png` / `.svg`.
    - `tray-light.png` (64x64) generated from `whatsnexus-logo-monocrome-white.png`.
    - `tray-dark.png` (64x64) generated from `whatsnexus-logo-monocrome-black.png`.
    - `tray-green-badge.png` (64x64) generated from `whatsnexus-logo-badge.png`.
    - `tray-light-badge.png` (64x64) generated from `whatsnexus-logo-monocrome-white-badge.png`.
    - `tray-dark-badge.png` (64x64) generated from `whatsnexus-logo-monocrome-black-badge.png`.
  - Updated the Splash Screen to display the sharp vector asset `whatsnexus-logo.svg`.
  - Updated the About section (`#tab-about`) to render the official vector asset `whatsnexus-logo.svg`.

---

## [0.18.1] - 2026-09-03
### Fixed
- **Descriptive Subtitles for Permission & System Modules:**
  - Added explanatory subtitles (`.perm-group-desc`) below main module headers: "Device Access", "Screen Sharing", "Download Management", and "Spellchecker", with i18n support across all 26 languages.
- **Uncapped Fluid Height for Spellchecker Container:**
  - Removed vertical scrollbar and `max-height` constraints on `.spellcheck-multiselect-container` (`height: auto; overflow: visible;`), allowing the container to expand downward naturally showing all language chips.
- **Visual Consistency & Double Card Removal:**
  - Eliminated redundant inner card background and border in the language container to fuse seamlessly with the parent card surface.
  - Structurally normalized the Spellchecker card using `.perm-row.download-management-row` identical to Download Management, ensuring perfect left-edge alignment with adjacent settings cards.

---

## [0.18.0] - 2026-09-03
### Added
- **Classic Doom Easter Egg in Isolated View (WASM):**
  - Added a discreet "Doomizate" configuration card with toggle control at the bottom of the About tab.
  - Implemented persistent setting storage in `settings.doomizate` (disabled by default).
  - Added a dynamic skull icon button (`<i class="fa-solid fa-skull"></i>`) to the sidebar navigation rail, positioned between "Add Account" and "Report Bug", displayed strictly when `settings.doomizate` is enabled.
  - Integrated `#doom-view` with an isolated `<webview>` running the WebAssembly port of Classic Doom.
  - Implemented complete tab switching workflow: opening Doom deactivates account tabs and hides other webviews; selecting an account returns to the chat view without disrupting WhatsApp sessions.

---

## [0.17.11] - 2026-09-03
### Changed
- **Full License Migration to GNU GPL v3:**
  - Added the official standard text of the **GNU General Public License v3 (GPL v3)** in `LICENSE` under Sentinel Studio copyright (`Copyright (C) 2026 Sentinel Studio`).
  - Updated package manifest (`package.json`) `"license"` field to `"GPL-3.0-or-later"`.
  - Updated `README.md` with version badge (`v0.17.11`), GPL v3 badge (`![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)`), and legal terms section.
- **UI & License Modal Refactoring:**
  - Renamed About section license badge to **"GNU GPL v3 License"**.
  - Refactored frontend source code (HTML, CSS, JS) eliminating residual `mit` identifiers in favor of `gpl` (`#btn-open-gpl-license`, `#gpl-license-modal`, `openGplModal()`, etc.).
  - Implemented structured GPL v3 explanation popup detailing copyleft conditions and warranty limitation, with translations in all 26 supported languages.

---

## [0.17.10] - 2026-09-03
### Changed
- **Spellchecker Fluid Horizontal Tag Layout:**
  - Refactored `.spellcheck-multiselect-container` with `display: flex; flex-wrap: wrap; gap: 10px;` so options distribute modularly from left to right with automatic line wrapping.
  - Redesigned items as styled chips (`.spellcheck-checkbox-item`) with rounded borders and responsive padding.
- **Dynamic Alphabetical Collation by Active Language:**
  - Implemented pre-render sorting using `.sort((a, b) => a.nombreTraducido.localeCompare(b.nombreTraducido, currentLang))` ensuring visual ordering matches the localized text displayed on screen.
- **Expanded BCP-47 Regional Catalog:**
  - Added complete regional variants for Spanish (`es-AR`, `es-ES`, `es-MX`, `es-US`, `es-419`), English (`en-US`, `en-GB`, `en-CA`, `en-AU`, `en-IN`, `en-NZ`, `en-ZA`), Portuguese (`pt-BR`, `pt-PT`), French (`fr-FR`, `fr-CA`, `fr-CH`), German (`de-DE`, `de-AT`, `de-CH`), Italian/Russian (`it`, `ru`), Arabic/Persian (`ar`, `fa`), and Asian/Other languages (`hi`, `id`, `ko`, `ta`, `tr`, `vi`).
- **Development Credits & Sentinel Studio Link:**
  - Updated development text to: *"WhatsNexus is maintained by Sentinel Studio and the GitHub community."*.
  - Added interactive `#btn-about-sentinel` button redirecting securely to `https://somossentinel.com/studio`.
- **Legal Disclaimer:**
  - Added a centered disclaimer block at the bottom of the About tab clarifying that WhatsNexus has no affiliation, sponsorship, or endorsement from WhatsApp or related messaging platforms.

### Fixed
- **Solid Background for License Modal:**
  - Eliminated unwanted transparency in `.app-modal-card`, `.app-modal-header`, and `.app-modal-body` using opaque theme tokens (`var(--bg-modal)`).

---

## [0.17.9] - 2026-09-03
### Changed
- **Dynamic Width for Tray Icon Style Dropdown:**
  - Updated CSS rules for `.setting-row-between .custom-select-wrapper` and `.custom-select-trigger` to adopt `width: max-content; flex: 0 0 auto;`, replicating theme selector behavior.
- **Restructuring of Interface Language Card:**
  - Reorganized language settings into a clean Flexbox layout (`.setting-row-between`) with descriptive label on the left and stylized dropdown on the right.
- **Interactive License Modal Popup:**
  - Transformed static license badge into an interactive trigger (`#btn-open-gpl-license`).
  - Added modal with backdrop blur, themed card, close button, and Escape key dismissal.
- **ZapZap Repository Link Button:**
  - Added `#btn-about-zapzap` button in Inspiration row opening external repository in user's default browser via safe IPC handler.

---

## [0.17.8] - 2026-09-03
### Changed
- **Multilingual Spellchecker with Checkboxes & Disk Space Management:**
  - Replaced single-selection dropdown with multi-select list inside `.spellcheck-multiselect-container`.
  - Implemented visual chip layout with checkbox, emoji flag, translated language name, and regional tag.
  - Linked language names to i18n dictionary (`lang_*`, `region_*`, `variant_*`) updating immediately on language switch.
  - Added multi-language dictionary support across default session and webview partitions.
  - Added `removeDictionariesForLanguages()` to detect unselected languages and clean up unused `.bdic` files from disk.

---

## [0.17.7] - 2026-09-03
### Fixed
- **Theme Selector System Auto Mode (OS Theme Detection):**
  - Fixed Electron `nativeTheme.themeSource` locking issue where manual theme switches prevented returning to OS auto detection.
  - Added `system` parameter in `set-theme-mode` IPC handler to reset `nativeTheme.themeSource = 'system'`.
  - Synchronously exposed `systemIsDark` on the `electronAPI` bridge (`preload-main.js`) derived from `nativeTheme.shouldUseDarkColors`.
  - Implemented the reactive `nativeTheme.on('updated')` listener in `main.js` to notify the Renderer in real-time on OS theme changes (via DBus desktop portal on Linux Wayland/X11).
  - Unified theme resolution in `getEffectiveThemeIsDark()` in `renderer.js`, ensuring that selecting "Automatic (System)" applies the desktop dark/light scheme immediately.

---

## [0.17.6] - 2026-09-03
### Removed
- **Privacidad y Red (Proxy & WebRTC Subsystem Elimination):**
  - Completely removed the "Privacidad y Red" settings tab and UI panel (`tab-network`) from `src/renderer/index.html`.
  - Cleaned all proxy configuration, WebRTC manipulation, strict isolation, and network UI logic (`updateNetworkUI`) from `src/renderer/renderer.js`.
  - Removed `update-network-settings` and WebRTC blocking overrides (`window.RTCPeerConnection`) from guest webviews in `src/preload.js`.
  - Removed `updateNetworkSettings` and `getNetworkSettings` IPC invokers from `src/preload-main.js`.
  - Removed backend network settings management, `ses.setProxy`, `setWebRTCIPHandlingPolicy`, and IPC handlers (`get-network-settings`, `update-network-settings`) in `src/main.js`, eliminating Linux `SIGSEGV` crashes and Chromium network service restarts.
  - Removed `disable-background-networking` CLI switch in `src/main.js` preventing Network Service process crashes.

---

## [0.17.5] - 2026-09-03
### Fixed
- **Sidebar Buttons & Accounts Initialization (SyntaxError Fix):**
  - Resolved `Uncaught SyntaxError: Identifier 'electronAPI' has already been declared` occurring at line 1 of `src/renderer/renderer.js`. The variable was previously exposed to the global window context via `contextBridge.exposeInMainWorld`, causing a syntax collision when re-declared with `const electronAPI`.
  - Replaced top-level declaration with a non-colliding fallback guard (`if (typeof window.electronAPI === 'undefined')`), allowing the entire renderer script to parse and execute properly.
  - Restored execution of `DOMContentLoaded`, accounts rendering (`renderAllSidebarAccounts()`), and click listeners for the sidebar navigation rail (Add Account, Bug Report, Donations, and Settings).
  - Added `openExternalUrl` alias bridge in `src/preload-main.js` to ensure 100% compatibility with external link callers.
  - Added console error/warning forwarding from `mainWindow.webContents` in `src/main.js` so renderer runtime errors are never silently suppressed in the CLI.

---

## [0.17.4] - 2026-09-03
### Fixed
- **Dynamic i18n Locale Resolution & Language Selector:**
  - Resolved universal fallback to English when switching languages: populated all 23 language JSON files (`fr.json`, `de.json`, `it.json`, `pt.json`, `zh.json`, etc.) with their complete dictionaries (184 keys) extracted from core definitions and translations.
  - Added dedicated `zh-CN.json` locale and normalized language resolution in `ipcMain.handle('load-locale')` to seamlessly fallback to base language codes when regional variants are requested (e.g. `zh-CN` -> `zh`).
  - Added granular `try/catch` error reporting with explicit `console.error` logs distinguishing between missing file paths and JSON syntax/parse errors both in the main process and renderer process.
  - Fixed language dropdown change event and custom selector clicks in `renderer.js` to immediately call `updateTranslations()` to re-render all `[data-i18n]` DOM elements across the application.
- **Download Management Pipeline & IPC Bridges (Main & Renderer):**
  - Re-established and unified IPC bridges across `preload-main.js` and `main.js`, exposing `selectFolder()`, `selectDownloadDirectory()`, `resetFolder()`, `resetDownloadDirectory()`, and `getDefaultDownloadsPath()`.
  - Configured `mainWindow.webContents.on('did-finish-load')` to emit `default-downloads-path` with `app.getPath('downloads')`, auto-populating the UI input on startup and settings load.
  - Connected `ipcMain.handle('select-folder')` to open `dialog.showOpenDialog({ properties: ['openDirectory'] })` and return the selected path to the renderer to update UI and persist in `system_settings.json`.
  - Audited `session.defaultSession.on('will-download')` and partitioned webview sessions, ensuring `rutaGuardada` is verified, directory is created if absent, and added explicit `console.log('Descargando en:', rutaGuardada)` debugging before invoking `item.setSavePath()`.
- **Donations View Button Contrast in Light Theme (CSS):**
  - Eliminated hardcoded `color: #ffffff;` from `.btn-donate` in `src/renderer/style.css`.
  - Replaced hardcoded styles with dynamic theme tokens: `background-color: var(--bg-hover)`, `color: var(--text-color)`, and `border: 1px solid var(--border-color)`.
  - Defined `--text-color: var(--text-primary)` in `:root` and `.theme-light` across all palettes, ensuring high-contrast dark text on light backgrounds in Light Theme and light text in Dark Theme.
  - Unified `.btn-primary-action` and input focus states to use `var(--bg-active)` instead of undefined `--whatsapp-green`.

---

## [0.17.3] - 2026-09-03
### Fixed
- **Privacy & Network Section i18n Localization:**
  - Audited `src/locales/es.json` and eliminated hardcoded English translation values for `network_proxy_desc`, `network_strict_isolation_title`, `network_strict_isolation_desc`, `strict_proxy_enabled_hint`, `network_restore_proxy_desc`, `network_webrtc_desc`, and `network_webrtc_badge`.
  - Updated `src/renderer/index.html` replacing raw English fallback strings inside the Privacy & Network module with native Spanish defaults matching the rest of the application template.
  - Sychronized dynamic strict proxy status hints (`strict_proxy_status_none`, `strict_proxy_status_available`) across both `es.json` and `en.json`.
- **Proxy and WebRTC Subsystem Verification (Main Process):**
  - Sanitized host and port parsing in `getProxyConfig()` (`main.js`), stripping accidental URI schemes (`http://`, `socks5://`) and trailing slashes to guarantee compliant Chromium proxy format (`http=host:port;https=host:port` or `socks5://host:port`).
  - Resolved runtime `TypeError` on WebRTC policy handling: in Electron, `setWebRTCIPHandlingPolicy` operates at the `webContents` layer rather than the `session` prototype.
  - Implemented `attachSessionWebRTC(ses)` polyfill and dynamic propagation to all active `webContents` instances (`webContents.getAllWebContents()`), as well as reactive policy enforcement on guest `<webview>` attachment (`did-attach-webview`).
  - Added structured backend `console.log()` reporting for `[Backend IPC: update-network-settings]`, `[Backend Proxy]`, and `[Backend WebRTC]` to monitor incoming payload and network application events in real time.
- **Dynamic Version Injection in "Acerca de":**
  - Removed static fallback versions ("0.13.1") from `src/preload-main.js` and `src/renderer/renderer.js`.
  - Updated `ipcMain.handle('get-system-info')` to explicitly return `appVersion: app.getVersion()` reading dynamically from `package.json`.
  - Connected `loadAboutInfo()` in `src/renderer/renderer.js` to immediately update `#about-app-version` upon settings view initialization, tab activation (`tab-about`), and locale changes.

---

## [0.17.2] - 2026-09-03
### Fixed
- **Sidebar Button Geometry & Layout Unification (UI/UX):**
  - Resolved visual sizing mismatch between upper account items and lower utility buttons (Configuración, Reportar Error, Donaciones, Añadir Cuenta).
  - Enforced exact matching dimensions on `.sidebar-bottom .icon-btn` (`52px` width, `52px` height, `0` padding, and `var(--shape-full)` border-radius) matching `.account-item`.
  - Scaled icon font size to `1.35rem` and aligned the M3 active rail indicator (`left: -12px; height: 36px`) to touch the sidebar boundary symmetrically.
  - Set `.sidebar-bottom` to `gap: 14px; flex-shrink: 0; width: 100%` with `.sidebar` containing `overflow-x: hidden; box-sizing: border-box`, completely eliminating risk of container overflow.
- **Appearance Settings Tray Icon Style Row Layout (CSS/HTML):**
  - Fixed visual breakage in Settings > Apariencia where the "Estilo del Icono en Bandeja" custom dropdown rendered vertically underneath its label.
  - Applied Flexbox styling with `.setting-row-between` (`display: flex; align-items: center; justify-content: space-between; gap: 16px;`) and aligned the label to the left with `margin-bottom: 0` and the dropdown to the right in the same horizontal row.
  - Configured `.setting-row-double` with a vertical flex layout (`gap: 20px; margin-top: 14px`) providing clean visual rhythm across the Tray setting card.
- **Download Management Pipeline & Session Interceptor (Main/Renderer IPC):**
  - Ensured native OS default download directory (`app.getPath('downloads')`) is automatically resolved, displayed, and utilized on startup when no user path is specified.
  - Bound the "Seleccionar Carpeta" action via `select-download-directory` IPC to `dialog.showOpenDialog` with `properties: ['openDirectory']`, safely updating user configuration, persisting to `system_settings.json`, and updating the read-only input view.
  - Connected the "Restablecer por Defecto" button via `reset-download-directory` IPC, resetting user configuration to `app.getPath('downloads')` and refreshing the view.
  - Hardened download interception via `configureSessionDownloads` across `session.defaultSession`, `session-created`, and `did-attach-webview` events, executing `item.setSavePath(path.join(rutaGuardada, item.getFilename()))` to guarantee all file downloads land in the designated directory.

---

## [0.17.1] - 2026-09-03
### Performance & Refactoring
- **Dynamic Modular i18n System (P-01 - Monolito de Diccionarios):**
  - Eliminated the monolithic 3,130-line hardcoded translation dictionary from `renderer.js`, reducing file size from 4,990 lines down to 1,860 lines and significantly improving RAM utilization.
  - Created modular directory `src/locales/` housing individual JSON translation files for each of the 25 supported languages.
  - Extracted complete 182-key dictionaries for English (`en.json`) and Spanish (`es.json`), and generated valid baseline JSON files for the remaining 23 languages.
  - Implemented lazy-loading mechanism (`loadActiveLocale`): loads solely the user-selected language with `en.json` retained in memory as an automatic fallback for missing keys.
  - Added secure IPC channel `load-locale` in `src/main.js` and exposed `electronAPI.loadLocale` in `src/preload-main.js`.
  - Switching language in Settings now dynamically loads the target `.json` file from disk and instantly updates DOM text nodes.
- **Native Chromium Spellchecker Alignment:**
  - Standardized `SPELLCHECK_MAP` in `src/main.js` mapping all 25 supported interface languages to their exact Electron/Chromium BCP-47 identifiers (`en-US`, `zh-CN`, `hi`, `es`, `fr`, `ar`, `bn`, `pt-BR`, `ru`, `ur`, `id`, `de`, `ja`, `mr`, `te`, `tr`, `ta`, `zh-TW`, `vi`, `fil`, `ko`, `fa`, `ha`, `sw`, `it`).
  - Confined spellchecker dictionary provisioning exclusively to native Chromium background management via `session.setSpellCheckerLanguages()` without external HTTP fetch or manual `.bdic` manipulation.
  - Sychronized spellchecker selection across `session.defaultSession` and all active/partitioned guest sessions (`persist:acc_*`).
- **Visual Styles & Themes Layout Optimization:**
  - Adjusted the flexbox layout in the "Temas y Estilo Visual" card (`.setting-row-inline-pair`):
    - Configured the "Modo de Apariencia" (Theme) dropdown container (`.setting-item-theme`) with `flex: 0 0 max-content` to occupy strictly the space needed for its longest label.
    - Set the "Paleta de Color" dropdown container (`.setting-item-palette`) to `flex: 1 1 auto` to absorb all freed horizontal space.

---

## [0.17.0] - 2026-09-03
### Added
- **"Acerca de" (About) Settings Section (UI/UX):**
  - Integrated a new settings tab "Acerca de" positioned strictly below "Privacidad y Red", with tab button (`data-tab="tab-about"`), info icon (`fa-solid fa-circle-info`), and full i18n support across 25 interface languages.
  - Centered App Header card with official WhatsNexus emblem, prominent title, tagline, and real-time version pill (`#about-app-version`).
  - **Technical Details Card:** Displays an elegant, monospace-styled grid of core system and runtime metrics:
    - Operating System (`os.type()` and `os.release()`).
    - CPU Architecture (`os.arch()`).
    - Electron version (`process.versions.electron`).
    - Chromium engine version (`process.versions.chrome`).
    - Node.js runtime version (`process.versions.node`).
    - V8 JavaScript engine version (`process.versions.v8`).
  - **License & Links Card:**
    - MIT License declaration with accent badge.
    - "Visitar repositorio en GitHub" primary button opening `https://github.com/Sentinel-Mexico/WhatsNexus-Dekstop` safely in the external OS browser via `openExternalUrl`.
    - "Reportar en GitHub Issues" secondary action button navigating directly to project issues.
  - **Credits & Acknowledgments Card:**
    - Community development attribution (Sentinel-Mexico / elChauriMx).
    - Design and concept acknowledgment crediting the original ZapZap project by Rafael Tosta.
- **Real-Time System Diagnostics IPC Bridge:**
  - Implemented `get-system-info` IPC handler in `src/main.js` importing native `os` and returning accurate runtime diagnostics.
  - Exposed `electronAPI.getSystemInfo()` in `src/preload-main.js` via `contextBridge.exposeInMainWorld()`.

---

## [0.16.0] - 2026-09-03
### Added
- **Privacy & Network Settings Section (UI/UX):**
  - Integrated a new settings tab "Privacidad y Red" placed strictly below "Permisos", with tab navigation (`data-tab="tab-network"`), shield icon (`fa-solid fa-shield-halved`), and full i18n translation across 25 interface languages.
  - Added **Proxy Configuration Module**:
    - "Usar proxy" primary toggle (`#network-use-proxy-toggle`) routing traffic through the configured proxy.
    - Custom styled dropdown (`#proxy-type-select`) supporting "Sin proxy", "HTTP", "SOCKS5", and "Sistema".
    - Dynamic Server/Host (`#proxy-host-input`) and Port (`#proxy-port-input`) input fields shown only when HTTP or SOCKS5 is selected.
    - "Strict proxy isolation" toggle (`#network-strict-proxy-toggle`) with dynamic status text (`#strict-proxy-status-text`) stating "Available only while an HTTP or SOCKS5 proxy is enabled" or "No hay proxy configurado", automatically disabled when direct connection is selected.
    - "Restaurar proxy..." action button (`#btn-restore-proxy`) resetting proxy settings to "Sin proxy" and disabling proxy toggles.
  - Added **WebRTC Privacy & Protection Module**:
    - "Protección WebRTC" toggle (`#network-webrtc-toggle`) with secondary description and "Legacy script-based protection" badge.
- **Multi-Session Proxy Routing & Strict Isolation (Main Process):**
  - Implemented `session.setProxy()` routing across `session.defaultSession` and all current and future partitioned guest sessions (`persist:acc_*`).
  - Added proxy configuration builder for HTTP (`http=...;https=...`), SOCKS5 (`socks5://...`), and System (`mode: 'auto_detect'`).
  - Strict Proxy Isolation eliminates bypass rules (`proxyBypassRules: ''`), enforcing all traffic through the proxy tunnel.
  - Clean proxy teardown via `{ mode: 'direct' }` upon restore or selection of "Sin proxy".
  - Persisted network configuration in `userData/network_settings.json`.
- **Multi-Layer WebRTC Leak Prevention:**
  - **Chromium Network Layer:** Configured `session.setWebRTCIPHandlingPolicy('disable-non-proxied-udp')` on all sessions to eliminate public IP leakage over non-proxied UDP interfaces.
  - **Guest Preload Layer (`src/preload.js`):** Intercepts and blocks `window.RTCPeerConnection`, `window.webkitRTCPeerConnection`, `window.RTCSessionDescription`, and `window.RTCIceCandidate` within WhatsApp Web guest pages, preventing scripts from establishing unauthorized P2P connections.
  - **Reactive Webview IPC Synchronization:** Webviews receive real-time `update-network-settings` IPC events upon settings modification and upon `dom-ready`.
- **Context Isolation & Preload APIs:**
  - Securely exposed `electronAPI.getNetworkSettings()` and `electronAPI.updateNetworkSettings()` in `src/preload-main.js` via `contextBridge.exposeInMainWorld()`.

---

## [0.15.0] - 2026-09-03
### Added
- **Donations Module (UI/UX):**
  - Integrated a new sidebar action button with heart icon (`fa-solid fa-heart`) positioned strictly between "Report Bug" and "Settings", equipped with unified tooltip positioning.
  - Implemented a full-window Donations view (`#donations-view`) inside `<main id="webview-container">` featuring a responsive CSS card grid for support platforms (GitHub Sponsors, PayPal, Ko-fi).
  - Configured each donation card with platform icon, descriptive copy, an external navigation indicator, and a green primary "Donate" button.
  - Centralized donation URLs in a configurable `DONATION_URLS` object in `renderer.js` for maintainability.
- **Secure External URL IPC Dispatch:**
  - Implemented `open-external-url` IPC handler in `src/main.js` and exposed `openExternalUrl` via `src/preload-main.js` to dispatch support links safely to the OS default browser with protocol validation.
- **System Downloads Management:**
  - Added a dedicated "Download Management" block in the Permissions/System settings panel featuring a read-only input, "Select Folder" button, and "Reset to Default" button.
  - Initialized default download path to the system native downloads directory (`app.getPath('downloads')`).
  - Integrated `dialog.showOpenDialog` folder picker via IPC, persisting user folder choice in `userData/system_settings.json`.
  - Intercepted `will-download` on `session.defaultSession` and all partitioned guest sessions (`persist:acc_*`), applying `item.setSavePath()` to automatically save incoming WhatsApp Web files in the designated directory.
- **Native Chromium Spellchecker Integration:**
  - Added a custom dropdown selector in the Permissions/System tab dynamically populated with the 25 interface languages.
  - Integrated Chromium's native Electron spellchecking engine without external APIs.
  - Mapped interface language codes to corresponding Chromium `.bdic` dictionary tags (e.g., `es-MX`, `en-US`, `pt-BR`, `de-DE`, `fr-FR`).
  - Automatically applied `session.setSpellCheckerLanguages()` across `session.defaultSession` and all current and future partitioned sessions.

---

## [0.14.0] - 2026-09-03
### Security
- **Strict Context Isolation & Node Integration Disabled (S-01):**
  - Enforced `contextIsolation: true` and `nodeIntegration: false` across all application windows (`mainWindow` and `splashWindow`).
  - Created secure preload scripts (`src/preload-main.js` and `src/splash/splash-preload.js`) exposing minimal, validated APIs via `contextBridge.exposeInMainWorld()`.
  - Refactored `renderer.js` and `splash.js` to eliminate all direct usages of `require()`, `process`, `ipcRenderer`, and `shell`.
- **Content Security Policy (S-02):**
  - Added strict CSP meta tags in `src/renderer/index.html` and `src/splash/splash.html` preventing execution of unauthorized remote scripts and objects.
- **XSS Prevention on InnerHTML (S-03):**
  - Implemented `escapeHtml(str)` utility in `renderer.js` to sanitize dynamic account names, IDs, status labels, and avatar URLs prior to DOM interpolation.
- **Dangerous Chromium Flag Cleanup (S-05, S-06):**
  - Removed `disable-site-isolation-trials` and `disable-ipc-flooding-protection` from `main.js`.
- **Safe External Link Dispatch (S-08):**
  - Intercepted external URL opening in `main.js` via IPC with strict protocol verification restricted to `http:` and `https:`.

### Added
- **Global Hardware Permissions Engine:**
  - Implemented centralized session permission control using `session.setPermissionRequestHandler` and `session.setPermissionCheckHandler` in `main.js` for Microphone, Camera, Location, and Screen Sharing (with audio detection).
  - Persisted user permission preferences to `userData/permissions.json` and automatically applied them across all partitioned sessions (`persist:acc_*`).
- **Unified Sidebar Floating Tooltip System:**
  - Decoupled tooltips from transformed action buttons by attaching a single `floatingTooltip` element to `document.body`.
  - Unified vertical tooltip positioning to an exact 8px offset from the right boundary of the sidebar for accounts, add account, report bug, and settings.

### Changed
- **Account Do Not Disturb (DND) Full Lockdown:**
  - Enhanced DND toggle to completely suppress native OS notifications and sound alerts at the guest preload layer and renderer dispatcher.
- **Global Notification Customization Strings:**
  - Standardized privacy replacements: contact name is overridden with `"Nombre oculto"`, message preview with `"Mensaje oculto"`, and contact photo falls back to local WhatsNexus branding when disabled.
  - Implemented `silent: true` native notification dispatching when notification sounds are disabled.
- **Zero-Mute Chat Multimedia Architecture:**
  - Completely removed `webContents.setAudioMuted(true)` from the codebase, guaranteeing that voice messages, videos, and media playback in chat tabs remain fully audible even when notifications are muted or DND is active.
  - Implemented selective `HTMLAudioElement.prototype.play` suppression in `preload.js` targeting solely automated alert chimes without affecting user-initiated media.
- **Sidebar Action Button Alignment:**
  - Removed unwanted hover rotation and custom background overrides from `#add-account-btn`, harmonizing its design with the standard M3 `.icon-btn` system.

---

## [0.13.1] - 2026-09-03
### Changed
- **Inline Theme & Color Palette Layout:**
  - Aligned "Paleta de Color" and "Modo de Apariencia" controls side-by-side on a single cohesive horizontal line (`.setting-row-inline-pair`), eliminating fragmented multi-line stacking in the Appearance panel.
- **Universal Material 3 Expressive Custom Dropdowns:**
  - Migrated every select element across the entire application (`#palette-select`, `#theme-select`, `#tray-style-select`, and `#privacy-preset-select`) to the unified, rounded custom dropdown component previously designed for the language selector.
  - Implemented dynamic label and active state synchronization through `initCustomDropdown` and `refreshAllCustomDropdowns()`, ensuring mutual exclusivity upon open, click-outside auto-dismiss, and theme-adaptive scrollbars.

---

## [0.13.0] - 2026-09-03
### Added
- **Material 3 Expressive (M3 Expressive) Design System:**
  - Modernized the overall graphical environment and component construction to adhere to Google's **Material 3 Expressive** design principles while maintaining 100% fidelity to all 5 color palettes (WhatsApp Emerald, Messenger, Telegram, Signal, Forest) in both Dark and Light modes.
  - **Navigation Rail:** Upgraded sidebar into an M3 Navigation Rail (`76px`) featuring responsive pill-shaped active rail indicators, squircle FAB for `#add-account-btn` with hover rotation, and full pill badges.
  - **M3 Expressive Switches:** Re-engineered toggle switches to the official M3 standard (`52x32px` pill track, dynamic thumb scaling from `16px` unchecked to `24px` checked, and spring morphing to `28px` on active press with `cubic-bezier(0.2, 0, 0, 1)`).
  - **Expressive Containers & Cards:** Applied M3 Large shape scale (`border-radius: 24px`) with soft ambient shadows and tonal hover transitions to `.setting-card`, `.notif-card`, `.perm-card`, and `.settings-account-card`.
  - **Pill-shaped Segmented Tabs:** Redesigned settings navigation tabs into expressive pill buttons (`border-radius: 9999px`) with tactile active feedback.
  - **Inputs, Buttons, and Selects:** Upgraded all text fields, select triggers, back buttons, and permission actions to M3 Medium/Full shape scales (`16px` to `9999px`) with expressive focus outlines.

---

## [0.12.5] - 2026-09-03
### Fixed
- **Dynamic Splash Screen Version Display:**
  - Corrected relative package lookup path in `src/splash/splash.js` (`../../package.json`).
  - Added synchronous IPC channel `get-app-version` in `src/main.js` (`app.getVersion()`) for dynamic, authoritative version retrieval.
  - Removed static `v0.5.0` fallback in `src/splash/splash.html`, guaranteeing the splash badge automatically and accurately renders the latest SemVer release on every startup.

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
