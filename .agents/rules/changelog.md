# Changelog Maintenance Rule

To maintain clear traceability between active development and production releases, the project maintains two distinct changelog files in neutral English:

1. **Development Changelog (`changelog-dev.md`):**
   - Tracks all granular changes, fixes, refactorings, and feature additions applied in the `Dev` branch.
   - **Continuous Trigger:** Every time a change or set of changes modifies the project version in `package.json`, the agent must immediately document the modifications under the corresponding version section in `changelog-dev.md`.
   - **Automatic Push to Dev:** Whenever a change is recorded in `changelog-dev.md`, the agent must create the corresponding commit and immediately push to `origin/Dev`.
   - Each entry should clearly classify changes (e.g., Features, Fixes, Performance, Refactoring, Documentation).

2. **Stable Release Changelog (`changelog.md`):**
   - Compiles and summarizes all accumulated changes between stable releases.
   - **Release Trigger:** This file is updated **strictly and only** when the user explicitly instructs to launch a new stable release (i.e. explicit instruction to merge `Dev` into `main` and push to `main`). Under no circumstance should development versions be included in `changelog.md`.
   - When triggered, compile a high-level, user-friendly summary of all features, improvements, and fixes delivered in that stable release compared to the previous stable milestone.
