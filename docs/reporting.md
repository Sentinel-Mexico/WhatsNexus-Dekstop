# Diagnostics, Reporting & Privacy

## 1. Automated Bug Reporting Pipeline

WhatsNexus includes an integrated diagnostic reporting mechanism accessible via the sidebar bug icon (`#report-bug-btn`). When clicked, the application automatically aggregates local environment metadata into a pre-filled GitHub issue template:

```text
User clicks Bug Icon
        │
        ▼
Gather System Diagnostics (OS, Architecture, Electron, Chromium, Language, Theme)
        │
        ▼
Format GitHub Issue Markdown Template
        │
        ▼
Encode URI parameters & launch default browser via shell.openExternal()
        │
        ▼
User reviews and submits report on GitHub
```

### 1.1 Collected Diagnostic Attributes
To expedite troubleshooting without exposing sensitive user information, the diagnostic payload includes only environment-level indicators:
- **Application Version**: Dynamically resolved from `package.json` (e.g., `v1.4.0`).
- **Platform & Architecture**: Detected from Node.js runtime (`process.platform` and `process.arch`).
- **Engine Runtimes**: Node, Electron (`process.versions.electron`), and Chromium (`process.versions.chrome`).
- **Application Preferences**: Active interface language (from 55 supported locales) and color palette (from 12 available themes).
- **Account Cardinality**: Total number of configured accounts (without IDs, names, or phone numbers).

### 1.2 Sanitization & Zero Credential Leaks
WhatsNexus adheres to strict privacy guarantees:
- **No Remote Telemetry**: The application contains no background analytics trackers, telemetry beacons, or third-party monitoring services.
- **No Token Transmission**: No session keys, phone numbers, avatars, cookies, or chat messages are ever read by or included in the diagnostic builder.
- **User Agency**: The diagnostic payload is passed as query parameters to GitHub. The user sees and controls the entire markdown body in their own browser before clicking submit.

---

## 2. Notification Privacy Presets & Custom Privacy Engine

To protect user confidentiality in public or shared workspaces, WhatsNexus implements configurable notification privacy presets and granular toggles within `src/preload.js` and `#tab-notifications`:

| Privacy Preset | Desktop Notifs | Contact Photo | Contact Name | Message Preview | Notification Sound |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Broad (Amplio)** | Enabled | Enabled | Enabled | Enabled | Enabled |
| **Medium (Medio)** | Enabled | Enabled | Enabled | Disabled (*Hidden*) | Enabled |
| **Strict (Estricto)** | Enabled | Disabled (*Generic App Icon*) | Disabled (*Hidden Contact*) | Disabled (*Hidden*) | Disabled (*Muted*) |
| **Custom (Personalizado)** | Configurable | Configurable | Configurable | Configurable | Configurable |

### Reactive Behavior
- **Template Synchronization:** Selecting a preset instantly toggles the corresponding options and propagates the updated policy to all guest sessions.
- **Granular Override:** Manually modifying any individual switch automatically changes the active preset selector to **"Personalizado" (Custom)**.
- **Master Desktop Toggle:** Disabling desktop notifications blocks system alert dispatch completely and dims sub-options in the settings interface.
- **In-flight Interception:** `src/preload.js` wraps the native HTML5 `window.Notification` constructor, dynamically filtering sender metadata, avatars, message bodies, and alert sounds in real time without requiring session refreshes.
