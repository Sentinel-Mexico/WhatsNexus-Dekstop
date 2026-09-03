# Development Changelog (`changelog-dev.md`)

This changelog records all granular updates, bug fixes, refactorings, and feature iterations developed on the `Dev` branch. Each version bump in `package.json` is documented here as it happens.

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
