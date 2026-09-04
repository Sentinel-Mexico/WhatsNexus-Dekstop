# WhatsNexus ⚡

![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)
![Version](https://img.shields.io/badge/version-v0.21.1-brightgreen.svg)
![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)

**WhatsNexus** is a cross-platform desktop application designed to manage multiple WhatsApp Web accounts simultaneously. It goes a step further by offering strict session isolation, allowing you to keep your personal and work accounts active in a single, tab-organized interface without data crossover.

## ✨ Key Features

*   **Multi-Account Support:** Run multiple WhatsApp accounts in separate tabs.
*   **Session Isolation:** Each tab operates in a completely encapsulated environment (different cookies, cache, and local storage) to prevent data crossover.
*   **Persistent Sessions:** Sessions are saved securely. You only need to scan the QR code the first time you add an account.
*   **Cross-Platform:** Seamless experience on Windows, macOS, and Linux distributions.
*   **System Tray Integration:** Keep it running in the background and receive notifications without cluttering your taskbar.
*   **Native Notifications:** Fully integrated with your operating system's notification system.

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
| **Linux package support (AppImage, Flatpak, DEB)** | ❌ | ✅ | ✅ |
| **Automatic OTA updates** | ❌ | AppImage (`.zsync`) | ✅ (`electron-updater` / GitHub) |
| **Custom CSS & JavaScript injection** | ❌ | ✅ | ✅ |
| **Multi-language internationalization (i18n)** | Official languages | Partial | ✅ (26 Languages) |
| **Open source license** | ❌ Proprietary | ✅ GPL-3.0 | ✅ GPL-3.0 |
| **Classic Doom Easter Egg** | ❌ | ❌ | ✅ |
| **Privacy model** | Browser shared session | Dedicated application | Dedicated isolated partitions |

## 🚀 Getting Started

### Prerequisites
*   Node.js or Python 3.10+ (depending on the chosen development framework)
*   Git

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/Sentinel-Mexico/WhatsNexus-Dekstop.git](https://github.com/Sentinel-Mexico/WhatsNexus-Dekstop.git)
    cd WhatsNexus-Dekstop
    ```

2.  **Install dependencies and run:**
    *(Exact commands will depend on the final framework)*
    ```bash
    # Example for Node.js / Electron:
    npm install
    npm start
    ```

## 🛠️ Tech Stack
*   **Core:** Electron.js
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
