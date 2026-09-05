# WhatsNexus Technical Documentation 📚

Welcome to the technical documentation for **WhatsNexus** (v1.4.0 Production Release), a multi-account WhatsApp Web desktop client built on Electron.js with strict session isolation, Chromium sandboxing, Deny-by-Default permissions, dynamic resource hibernation, offline protections, and comprehensive 55-language internationalization (including Elvish Tengwar and Klingon).

This directory serves as the definitive reference for architects, maintainers, and contributors to understand the codebase structure, engineering decisions, performance strategies, and operational workflows.

---

## 📑 Documentation Index

| Document | Purpose & Scope |
| :--- | :--- |
| **[Architecture](architecture.md)** | Application architecture, multi-process lifecycle, IPC protocols, and splash screen pre-warming pipeline. |
| **[Commit & Release Conventions](commit-convention.md)** | SemVer versioning rules, commit message formatting, Git branching strategy (`Dev` vs `main`), and changelog maintenance. |
| **[Session Isolation](session-isolation.md)** | Persistent partition storage (`persist:acc_<id>`), cookie/cache isolation, and multi-profile security model. |
| **[Memory & Performance](memory-and-performance.md)** | Tab hibernation lifecycle, complete DOM destruction, lazy loading, debounced preload observers, and Chromium flags. |
| **[Bug Reporting & Diagnostics](reporting.md)** | In-app automated bug reporting workflow, client-side diagnostics aggregation, and notification privacy profiles. |
| **[Maintenance & Development](maintenance.md)** | Local environment setup, dependencies, packaging, version synchronization workflows, and codebase guidelines. |
| **[Testing & Verification](testing.md)** | Automated syntax checks, regression testing checklists, hibernation verification, and platform-specific tests. |

---

## 💡 Acknowledgements & Inspiration

WhatsNexus takes its design inspiration and desktop messaging vision from [Rafael Tosta's](https://github.com/rafatosta) [ZapZap](https://github.com/rafatosta/zapzap) project. While WhatsNexus is written completely from scratch using an independent technology stack (Electron.js, JavaScript, and CSS rather than PyQt6/Python), we express our gratitude to the creator of ZapZap for pioneering the concept of clean multi-session WhatsApp management on desktop Linux and beyond.
