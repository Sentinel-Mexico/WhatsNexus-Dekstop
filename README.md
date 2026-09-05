# WhatsNexus ⚡

![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)
![Version](https://img.shields.io/badge/version-v1.1.1-brightgreen.svg)
![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)

**WhatsNexus** is an open-source, production-ready desktop application built to manage multiple WhatsApp Web accounts concurrently. Built on top of Electron.js with strict session isolation (`StoragePartition`), dynamic tab hibernation, comprehensive offline protection, and 26 global languages, WhatsNexus keeps your personal, freelance, and business communications organized without data crossover.

## ✨ Key Features

*   **Multi-Account Management:** Run multiple WhatsApp accounts simultaneously in a clean, vertical sidebar.
*   **Strict Session Isolation:** Every account operates in a sandboxed, persistent storage partition (`persist:acc_*`) with completely segregated cookies, cache, local storage, and IndexedDB.
*   **Persistent Login Sessions:** QR codes only need to be scanned once. Sessions persist securely on disk across application restarts.
*   **Intelligent Tab Hibernation:** Inactive accounts automatically hibernate after 20 minutes of idle time, destroying unneeded `<webview>` instances to reclaim up to 450 MB RAM per tab.
*   **Comprehensive Offline Protections:** Built-in offline container screens with retry buttons and a system-wide reconnection modal with reactive network state listeners.
*   **Automated OTA Updates:** Integrated auto-updater powered by `electron-updater` and `electron-log` that checks, downloads, and restarts to apply new versions from GitHub Releases.
*   **Native System Tray & Notification Badges:** Runs discreetly in the background, minimizing to the system tray with dynamic unread message count badges.
*   **Privacy Presets & DND:** Configurable notification privacy presets (Broad, Medium, Strict, Custom) and account-specific Do Not Disturb controls.
*   **Official Poppins Typography:** Elegant and readable typography using Google Fonts Poppins across all interface elements.
*   **Curated Theme Engine:** Beautiful default WhatsNexus theme (dark and light modes), plus Dracula, Nord, Monokai, and custom color presets.
*   **Global Internationalization (i18n):** Modular on-demand translations across 26 global languages.
*   **Freedoom Easter Egg:** 100% offline, native WebAssembly Chocolate Doom port loaded with BSD-licensed Freedoom: Phase 1, instant audio playback, and floating controls overlay.
*   **Multiplatform CI/CD:** Automated GitHub Actions build pipeline generating `.deb`, `.AppImage`, `.snap` (x64 and arm64), `.dmg` (x64 and arm64), and `.exe` (NSIS x64).

## ⚖️ Comparison: WhatsApp Web vs. ZapZap vs. WhatsNexus

| Feature | WhatsApp Web | ZapZap | WhatsNexus ⚡ |
| :--- | :---: | :---: | :---: |
| **Runs in your default browser** | ✅ | ❌ | ❌ |
| **Standalone desktop application** | ❌ | ✅ | ✅ |
| **Multiple accounts (simultaneous tabs)** | ❌ | ✅ | ✅ |
| **Strict session isolation (cookies & cache)** | ❌ | ✅ | ✅ |
| **Native system tray integration** | ❌ | ✅ | ✅ |
| **Unread badge counter on tray icon** | ❌ | ❌ | ✅ |
| **Native desktop notifications** | Limited | ✅ | ✅ |
| **Granular notification privacy presets** | ❌ | ❌ | ✅ |
| **Memory management & tab hibernation** | ❌ | ❌ | ✅ |
| **Spell checking with regional dictionaries** | Browser dependent | ✅ | ✅ |
| **Curated theme engine & brand palettes** | ❌ *(Light/Dark only)* | Limited | ✅ *(WhatsNexus, Dracula, Nord, etc.)* |
| **Cross-platform support** | Browser / Store app | Linux focused (PyQt) | ✅ (Linux, Windows, macOS) |
| **Linux package support (AppImage, Snap, DEB)** | ❌ | ✅ | ✅ |
| **Automatic OTA updates** | ❌ | AppImage (`.zsync`) | ✅ (`electron-updater` / GitHub) |
| **Offline protection & auto-reconnect** | ❌ | ❌ | ✅ |
| **Custom CSS & JavaScript injection** | ❌ | ✅ | ✅ |
| **Multi-language internationalization (i18n)** | Official languages | Partial | ✅ (26 Languages) |
| **Open source license** | ❌ Proprietary | ✅ GPL-3.0 | ✅ GPL-3.0 |
| **Classic Doom Easter Egg** | ❌ | ❌ | ✅ |
| **Privacy model** | Browser shared session | Dedicated application | Dedicated isolated partitions |

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
