# WhatsNexus ⚡

![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)
![Version](https://img.shields.io/badge/version-v1.7.2-brightgreen.svg)
![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)

**WhatsNexus** is an open-source, production-ready desktop application built to manage multiple WhatsApp Web accounts concurrently. Built on top of Electron.js with strict session isolation (`StoragePartition`), dynamic tab hibernation, comprehensive offline protection, and 55 global languages, WhatsNexus keeps your personal, freelance, and business communications organized without data crossover.

## ✨ Key Features

*   **Multi-Account Management:** Run multiple WhatsApp accounts simultaneously in a clean, vertical sidebar.
*   **Strict Session Isolation & Sandboxing:** Every account operates in a sandboxed, persistent storage partition (`persist:acc_*`) with completely segregated cookies, cache, local storage, and IndexedDB under Chromium sandboxing (`sandbox: true`) and Deny-by-Default hardware permissions.
*   **Persistent Login Sessions:** QR codes only need to be scanned once. Sessions persist securely on disk across application restarts.
*   **Intelligent Tab Hibernation:** Inactive accounts automatically hibernate after 20 minutes of idle time, destroying unneeded `<webview>` instances to reclaim up to 450 MB RAM per tab.
*   **Comprehensive Offline Protections:** Built-in offline container screens with retry buttons and a system-wide reconnection modal with reactive network state listeners.
*   **Automated OTA Updates:** Integrated auto-updater powered by `electron-updater` and `electron-log` that checks, downloads, and restarts to apply new versions from GitHub Releases.
*   **Native System Tray & Notification Badges:** Runs discreetly in the background, minimizing to the system tray with dynamic unread message count badges and in-memory circular avatar rendering.
*   **Privacy Presets & DND:** Configurable notification privacy presets (Broad, Medium, Strict, Custom) and account-specific Do Not Disturb controls.
*   **Official Poppins Typography & Conlang Fonts:** Elegant and readable typography using Google Fonts Poppins, plus dedicated custom font stacks for constructed languages (Tengwar Telcontar and Klingon pIqaD).
*   **Modular Theme Engine & Customizer:** 16 modular color palettes stored in validated JSON definitions across 4 structured visual tiers (Own, Original, Messaging, and Pop Culture: WhatsNexus, Alto Contraste, Bosque, Cyber-Nexus, Dracula, Nord, Retro, Steampunk, Messenger, Signal, Telegram, WhatsApp, Doom, Star Trek, Star Wars, Vóxel) with dynamic startup scanning, dynamic switch labels, and an interactive real-time Customization studio.
*   **Global Internationalization (i18n):** Modular on-demand translations across 55 global languages, including constructed languages (Elvish Tengwar and Klingon) with in-memory caching.
*   **Multiplatform CI/CD:** Automated GitHub Actions build pipeline generating `.deb`, `.AppImage` (Linux x64 and arm64), `.dmg` (macOS x64 and arm64), and `.exe` (Windows NSIS x64).

## ⚖️ Comparison: WhatsApp Web vs. WhatsApp Desktop vs. ZapZap vs. WhatsNexus

| Feature | WhatsApp Web | WhatsApp Desktop | ZapZap | WhatsNexus ⚡ |
| :--- | :---: | :---: | :---: | :---: |
| **Runs in your default browser** | ✅ | ❌ | ❌ | ❌ |
| **Standalone desktop application** | ❌ | ✅ | ✅ | ✅ |
| **Multiple accounts (simultaneous tabs)** | ❌ | ❌ *(Single active account)* | ✅ | ✅ *(Simultaneous vertical tabs)* |
| **Strict session isolation (cookies & cache)** | ❌ | ❌ *(Single profile instance)* | ✅ | ✅ *(Independent `StoragePartition`)* |
| **Native system tray integration** | ❌ | ✅ *(Minimizes to tray)* | ✅ | ✅ *(Minimize to tray & background)* |
| **Unread badge counter on tray icon** | ❌ | ⚠️ *(Taskbar/Dock only; limited tray)* | ❌ | ✅ *(Dynamic numeric badge)* |
| **Native desktop notifications** | Limited | ✅ | ✅ | ✅ *(In-memory circular avatars & audio)* |
| **Granular notification privacy presets** | ❌ | ❌ *(Basic mute / preview toggle)* | ❌ | ✅ *(Broad, Medium, Strict, Custom)* |
| **Memory management & tab hibernation** | ❌ | ❌ *(Monolithic process)* | ❌ | ✅ *(Auto-hibernation after 20m idle)* |
| **Spell checking with regional dictionaries** | Browser dependent | ✅ *(OS spellchecker)* | ✅ | ✅ *(Multilingual regional dictionaries)* |
| **Curated theme engine & brand palettes** | ❌ *(Light/Dark only)* | ❌ *(Light/Dark only)* | Limited | ✅ *(16 Palettes across 4 tiers + Custom)* |
| **Cross-platform support** | Browser / Store app | ⚠️ *(Windows & macOS only; No Linux)* | Linux focused (PyQt) | ✅ *(Linux, Windows, macOS)* |
| **Linux package support (AppImage, DEB)** | ❌ | ❌ *(No official Linux client)* | ✅ | ✅ *(`.deb`, `.AppImage` x64 & arm64)* |
| **Automatic OTA updates** | ❌ | ✅ *(Store / background updater)* | AppImage (`.zsync`) | ✅ (`electron-updater` / GitHub Releases) |
| **Offline protection & auto-reconnect** | ❌ | ❌ *(Generic retry screen)* | ❌ | ✅ *(Reactive offline container & modal)* |
| **Custom CSS & JavaScript injection** | ❌ | ❌ *(Closed-source binary)* | ✅ | ✅ *(Preload script & DOM styling)* |
| **Multi-language internationalization (i18n)** | Official languages | Official languages | Partial | ✅ *(55 Languages + Conlangs with cache)* |
| **Open source license** | ❌ Proprietary | ❌ Proprietary | ✅ GPL-3.0 | ✅ GPL-3.0 |
| **Privacy model** | Browser shared session | Proprietary telemetry & local sandbox | Dedicated application | Dedicated isolated partitions + Sandbox |

## 🚀 Getting Started

### Prerequisites
*   **Node.js**: Version 18.x or higher (LTS recommended)
*   **npm**: Version 9.x or higher
*   **Git**

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Sentinel-Mexico/WhatsNexus-Dekstop.git
    cd WhatsNexus-Dekstop
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run in development mode:**
    ```bash
    npm start
    ```

## 🛠️ Tech Stack
*   **Core Framework:** Electron.js (Chromium + Node.js)
*   **Frontend UI:** Vanilla HTML5, CSS3, Modern ES6+ JavaScript
*   **Typography:** Google Fonts Poppins
*   **Engine & Runtime:** WebAssembly (Wasm), Emscripten, WebAudio API
*   **Updates & Logging:** `electron-updater`, `electron-log`
*   **Build & Distribution:** `electron-builder`, GitHub Actions CI/CD matrix
*   **Frontend:** HTML, CSS, JavaScript

## 📖 Documentation

Comprehensive technical documentation is available in the [`docs/`](docs/README.md) directory:
*   [Architecture Overview](docs/architecture.md)
*   [Commit & Release Conventions](docs/commit-convention.md)
*   [Session Isolation & Multi-Account](docs/session-isolation.md)
*   [Memory Management & Tab Hibernation](docs/memory-and-performance.md)
*   [Diagnostics & Bug Reporting](docs/reporting.md)
*   [Development & Maintenance Guide](docs/maintenance.md)
*   [Testing & QA Guide](docs/testing.md)

## 💡 Inspiration & Acknowledgements

The graphical user interface, layout, and core functional concept of WhatsNexus were deeply inspired by the excellent work done by [Rafael Tosta](https://github.com/rafatosta) on the [ZapZap](https://github.com/rafatosta/zapzap) project. We want to express our gratitude and give full credit to the creator of ZapZap for paving the way and providing the vision for a better desktop messaging experience.

*Please note: While WhatsNexus draws significant UI/UX inspiration from ZapZap, our codebase is a completely independent implementation. Built from the ground up, WhatsNexus utilizes a different technological stack and does not incorporate or reuse any source code from the original ZapZap repository.*

## 🤝 Contributing
Contributions, issue reports, and feature requests are welcome! Feel free to check the [issues](https://github.com/Sentinel-Mexico/WhatsNexus-Dekstop/issues) page.

## 📝 License
This project is licensed under the GNU GPL v3 License - see the [LICENSE](LICENSE) file for details.
