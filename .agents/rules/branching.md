# Git Branching and Release Workflow Rule

1. **Development Branch (`Dev`):**
   - All ongoing development, code changes, bug fixes, refactoring, and feature updates must be committed and pushed exclusively to the `Dev` branch.
   - The active working branch for the agent must remain `Dev` by default.

2. **Production / Stable Branch (`main`):**
   - The `main` branch is strictly reserved for stable, production-ready releases.
   - Pushing or merging into `main` is strictly prohibited unless the user explicitly authorizes releasing a new stable version.

3. **Release Procedure:**
   - Only upon explicit user authorization to launch a new stable release shall changes from `Dev` be merged into `main`.
   - When a release occurs, both `main` and `Dev` must be kept in sync so future development continues cleanly from the latest release point.
