# Changelog Maintenance Rule

To maintain clear traceability between active development and production releases, the project maintains two distinct changelog files in neutral English:

1. **Development Changelog (`changelog-dev.md`):**
   - Tracks all granular changes, fixes, refactorings, and feature additions applied in the `Dev` branch.
   - **Continuous Trigger:** Every time a change or set of changes modifies the project version in `package.json`, the agent must immediately document the modifications under the corresponding version section in `changelog-dev.md`.
   - **Mandatory Version Synchronization Quartet:** Every time a version change is made in `changelog-dev.md` (or a new version entry is added), the agent **must explicitly verify and guarantee** that `package.json`, `package-lock.json`, and the version badge in the root `README.md` (`![Version](https://img.shields.io/badge/version-v<VERSION>-brightgreen.svg)`) match the latest changes and the version in `changelog-dev.md` with 100% parity before committing. Execute `npm install --package-lock-only` (or verify `package-lock.json`) to guarantee complete lockfile synchronization.
   - **Automatic Push to Dev:** Every time a version change is made (and recorded in `changelog-dev.md`), the agent must create the corresponding commit and immediately push to `origin/Dev`.
   - Each entry should clearly classify changes (e.g., Features, Fixes, Performance, Refactoring, Documentation).

2. **Stable Release Changelog (`changelog.md`):**
   - Compiles and summarizes accumulated changes across stable releases.
   - **Strict Modification Constraint:** The `changelog.md` file can **ONLY** be modified whenever a push to `main` is performed (i.e. when the user explicitly requests to push to `main` for a stable release). If a push to `main` is not being executed, this file **MUST NOT** be modified under any circumstances.
   - **Release Summary Generation on Push to Main:** When the user instructs to push to `main`, the agent must generate a consolidated, user-friendly summary in `changelog.md` covering all improvements since the last entry in `changelog.md`, taking the version entries in `changelog-dev.md` as the authoritative source of reference.
   - Development versions must never appear in `changelog.md`.
