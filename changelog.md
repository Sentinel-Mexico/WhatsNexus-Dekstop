# Changelog

All notable changes to the stable releases of WhatsNexus Desktop are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
