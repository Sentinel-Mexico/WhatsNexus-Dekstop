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
- **Application Version**: Dynamically resolved from `package.json` (e.g., `v0.5.2 (Beta)`).
- **Platform & Architecture**: Detected from Node.js runtime (`process.platform` and `process.arch`).
- **Engine Runtimes**: Node, Electron (`process.versions.electron`), and Chromium (`process.versions.chrome`).
- **Application Preferences**: Active interface language and color theme.
- **Account Cardinality**: Total number of configured accounts (without IDs, names, or phone numbers).

### 1.2 Sanitization & Zero Credential Leaks
WhatsNexus adheres to strict privacy guarantees:
- **No Remote Telemetry**: The application contains no background analytics trackers, telemetry beacons, or third-party monitoring services.
- **No Token Transmission**: No session keys, phone numbers, avatars, cookies, or chat messages are ever read by or included in the diagnostic builder.
- **User Agency**: The diagnostic payload is passed as query parameters to GitHub. The user sees and controls the entire markdown body in their own browser before clicking submit.

---

## 2. Notification Privacy Profiles

To protect user confidentiality in public or shared workspaces, WhatsNexus implements configurable notification privacy profiles within `src/preload.js` and `#settings-view`:

| Privacy Profile | Notification Avatar | Sender Title | Message Content | System Sound |
| :--- | :--- | :--- | :--- | :--- |
| **Broad (Default)** | Contact Profile Photo | Contact Name / Group | Full Message Preview | Yes (Enabled) |
| **Medium** | Contact Profile Photo | Contact Name / Group | *"Hidden message"* | Yes (Enabled) |
| **Strict** | App Icon (Generic) | *"Hidden contact"* | *"Hidden message"* | No (Muted) |

Users can adjust their active privacy profile at any time under **Settings $\rightarrow$ Notifications**, with updates applied instantly across all active sessions.
