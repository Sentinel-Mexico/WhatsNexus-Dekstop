# Git Branching and Release Workflow Rule

1. **Development Branch (`Dev`):**
   - All ongoing development, code changes, bug fixes, refactoring, and feature updates must be committed and pushed exclusively to the `Dev` branch.
   - **Version Change Push Mandate:** Every single time a version change is made, the changes must be committed and pushed immediately to `Dev` (`origin/Dev`).
   - The active working branch for the agent must remain `Dev` by default.

2. **Production / Stable Branch (`main`):**
   - The `main` branch is strictly reserved for stable, production-ready releases.
   - Pushing or merging into `main` is strictly prohibited unless the user explicitly authorizes releasing a new stable version or instructs to push to `main`.

3. **Release Procedure (Push to `main`):**
   - Only upon explicit user request to push to `main` (or launch a new stable release) shall changes from `Dev` be merged into `main`.
   - **Mandatory README and Docs Audit:** Every time a push or release to `main` is executed, the agent **MUST OBLIGATORILY** inspect the root `README.md` and all files in `/docs` (`docs/README.md`, `architecture.md`, `commit-convention.md`, `maintenance.md`, `memory-and-performance.md`, `reporting.md`, `session-isolation.md`, `testing.md`) to verify if updates are needed so that they 100% agree with and reflect all changes, features, and fixes developed since the previous release.
   - When requested to push to `main`, generate a high-level summary in `changelog.md` referencing all version entries in `changelog-dev.md` since the last release entry.
   - Perform the push to `main` and ensure `Dev` is synchronized with `main`. Future development immediately continues on `Dev`.
