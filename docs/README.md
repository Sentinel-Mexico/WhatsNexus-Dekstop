# WhatsNexus Technical Documentation 📚

Welcome to the internal technical documentation for **WhatsNexus**, a multi-account WhatsApp Web desktop client built on Electron.js with strict session isolation, dynamic resource hibernation, and full internationalization.

This directory serves as the definitive reference for architects, maintainers, and contributors to understand the codebase structure, engineering decisions, performance strategies, and operational workflows.

---

## 📑 Documentation Index

| Document | Purpose & Scope |
| :--- | :--- |
| **[Architecture](file:///home/chauri/Drives/HDD-2/github/WhatsNexus-Desktop/WhatsNexus-Dekstop/docs/architecture.md)** | Application architecture, multi-process lifecycle, IPC protocols, and splash screen pre-warming pipeline. |
| **[Commit & Release Conventions](file:///home/chauri/Drives/HDD-2/github/WhatsNexus-Desktop/WhatsNexus-Dekstop/docs/commit-convention.md)** | SemVer versioning rules, commit message formatting, Git branching strategy (`Dev` vs `main`), and changelog maintenance. |
| **[Session Isolation](file:///home/chauri/Drives/HDD-2/github/WhatsNexus-Desktop/WhatsNexus-Dekstop/docs/session-isolation.md)** | Persistent partition storage (`persist:acc_<id>`), cookie/cache isolation, and multi-profile security model. |
| **[Memory & Performance](file:///home/chauri/Drives/HDD-2/github/WhatsNexus-Desktop/WhatsNexus-Dekstop/docs/memory-and-performance.md)** | Tab hibernation lifecycle, complete DOM destruction, lazy loading, debounced preload observers, and Chromium flags. |
| **[Bug Reporting & Diagnostics](file:///home/chauri/Drives/HDD-2/github/WhatsNexus-Desktop/WhatsNexus-Dekstop/docs/reporting.md)** | In-app automated bug reporting workflow, client-side diagnostics aggregation, and notification privacy profiles. |
| **[Maintenance & Development](file:///home/chauri/Drives/HDD-2/github/WhatsNexus-Desktop/WhatsNexus-Dekstop/docs/maintenance.md)** | Local environment setup, dependencies, packaging, version synchronization workflows, and codebase guidelines. |
| **[Testing & Verification](file:///home/chauri/Drives/HDD-2/github/WhatsNexus-Desktop/WhatsNexus-Dekstop/docs/testing.md)** | Automated syntax checks, regression testing checklists, hibernation verification, and platform-specific tests. |

---

## 💡 Acknowledgements & Inspiration

WhatsNexus takes its design inspiration and desktop messaging vision from [Rafael Tosta's](https://github.com/rafatosta) [ZapZap](https://github.com/rafatosta/zapzap) project. While WhatsNexus is written completely from scratch using an independent technology stack (Electron.js, JavaScript, and CSS rather than PyQt6/Python), we express our gratitude to the creator of ZapZap for pioneering the concept of clean multi-session WhatsApp management on desktop Linux and beyond.
