# Development Changelog (`changelog-dev.md`)

This changelog records all granular updates, bug fixes, refactorings, and feature iterations developed on the `Dev` branch. Each version bump in `package.json` is documented here as it happens.

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
