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

> **IMPORTANT NOTE (Beta / Initial Development Phase):**
> Currently, the project is in the initial development phase (version `0.x.x`). During this phase, the first digit (MAJOR) will remain at `0`. Any new feature will increment the MINOR digit (e.g., from `0.1.0` to `0.2.0`), and bug fixes will increment the PATCH digit (e.g., from `0.1.0` to `0.1.1`). The transition to version `1.0.0` will only occur when the user explicitly indicates that the application has reached its first stable, finalized release.

> **VERSION SYNCHRONIZATION RULE:**
> Whenever a version change occurs, it must be reflected across **all** files where the version is defined. In this Node.js project, you must update `package.json` and subsequently run `npm install` (or `npm update`) to ensure `package-lock.json` and other generated files remain properly synchronized with the new version.

> **COMMIT AND PUSH MESSAGE FORMAT RULE:**
> Whenever preparing a Git commit or push, the message must strictly begin with the prefix of the current version followed by the change type and a summary of the update.
> Required format: `"v.<VERSION> <type>: <summary>"`
> Example: `"v.0.3.1 perf: implement lazy loading on startup, debounce preload observers, ..."`

**Final instruction for the agent:** Every time you deliver updated code, include a brief comment in your response indicating which type of increment you applied (Patch, Minor, or Major) along with the rationale based on these rules.
