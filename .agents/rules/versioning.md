# Semantic Versioning (SemVer) Rule

For each new request or set of changes applied to the codebase, the agent must evaluate the impact of the modifications to determine the new version number in `package.json`. The strict format to follow is: MAJOR.MINOR.PATCH (Example: 2.1.0).

The agent must increment the version following these logical rules:

1. **PATCH INCREMENT** (Third digit - e.g., from 2.1.0 to 2.1.1):
Apply this increment when the request consists solely of backward-compatible changes that do not alter the main functionality.
- Use cases: Bug fixes, security patches, minor user interface (UI) tweaks, internal code refactoring, performance optimizations, or minor dependency updates.

2. **MINOR INCREMENT** (Second digit - e.g., from 2.1.0 to 2.2.0):
Apply this increment when the request introduces new functionality or features to the software, while maintaining compatibility with previous versions. When doing this, the PATCH digit must be reset to 0.
- Use cases: Adding a new tool, introducing a new settings menu, adding support for a new language, or integrating a new API that does not break the existing structure.

3. **MAJOR INCREMENT** (First digit - e.g., from 2.1.0 to 3.0.0):
Apply this increment when the request involves drastic or incompatible changes that break backward compatibility or modify the core application structure. When doing this, both the MINOR and PATCH digits must be reset to 0.
- Use cases: Fundamental architecture changes (e.g., migrating from PyQt6 to Electron), complete interface redesigns that significantly change the user experience (UX), or database modifications requiring an incompatible migration.

> **MILESTONE STATUS (Production / Post-Beta Phase):**
> As of version `1.0.0`, the project has graduated from the initial beta phase (`0.x.x`) into official stable production. All subsequent iterations adhere to standard SemVer: breaking architecture/API overhauls trigger a MAJOR increment (`2.0.0`), backward-compatible features trigger a MINOR increment (`1.1.0`), and fixes/refactors trigger a PATCH increment (`1.0.1`).
>
> **MANDATORY VERSION SYNCHRONIZATION QUARTET RULE:**
> Every single time `changelog-dev.md` is updated (or a version bump is introduced), the agent **must explicitly verify and guarantee** that `package.json`, `package-lock.json`, and the version badge in the root `README.md` are updated to match the exact same version number corresponding to the latest changes in `changelog-dev.md`. Under no circumstance may any of the quartet files diverge in version.
> - When bumping a version, immediately update `package.json`.
> - Run `npm install --package-lock-only` (or verify and update `package-lock.json`) so the lockfile matches `package.json` and `changelog-dev.md` with 100% parity before committing.
> - Update the version badge at the beginning of the root `README.md` (`![Version](https://img.shields.io/badge/version-v<VERSION>-brightgreen.svg)`) so it reflects the new version.
> - Verify that `changelog-dev.md`, `package.json`, `package-lock.json`, and the root `README.md` badge all reflect the exact same version string.
> - **Mandatory Push to Dev:** Every single time a version change is made, the commit must be pushed immediately to the `Dev` branch (`origin/Dev`).

> **COMMIT AND PUSH MESSAGE FORMAT RULE:**
> Whenever preparing a Git commit or push, the message must strictly begin with the prefix of the current version followed by the change type and a summary of the update.
> Required format: `"v.<VERSION> <type>: <summary>"`
> Example: `"v.0.3.1 perf: implement lazy loading on startup, debounce preload observers, ..."`

**Final instruction for the agent:** Every time you deliver updated code, include a brief comment in your response indicating which type of increment you applied (Patch, Minor, or Major) along with the rationale based on these rules.
