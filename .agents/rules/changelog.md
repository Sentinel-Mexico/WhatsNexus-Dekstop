# Changelog Maintenance Rule

> **SUBORDINATION NOTICE:**
> This rule is strictly subordinate to the **Global Agent Engineering & Operational Governance** (`antigravity-global-engineering-governance`). In the event of any conflict, the Global Governance takes absolute precedence.

---

## 1. Dual Changelog Integrity (Global Invariant 3)
To maintain total traceability between active development iterations and stable production releases, the project enforces strict dual changelog separation in neutral English:

1. **Development Changelog (`changelog-dev.md`):**
   - **Active Ledger:** Captures all active iterations, granular changes, fixes, refactorings, performance improvements, and feature additions on the `Dev` branch.
   - **Task Delta Trigger:** At the conclusion of the requested task or prompt, assess cumulative delta and add a categorized entry under `Features`, `Fixes`, `Performance`, `Refactoring`, or `Documentation`.
   - **Version Parity Quartet (Global Invariant 4):** Whenever a new header is added in `changelog-dev.md`, the version string must maintain 100% parity with the Version Authority File (`package.json`), the lockfile (`package-lock.json`), and the root `README.md` badge.
   - **No Micro-Pushes:** Do not push incrementally on intermediate edits. Commit and push strictly once per completed task or prompt.

2. **Stable Release Changelog (`changelog.md`):**
   - **Strict Read-Only Status:** `changelog.md` is strictly read-only during ongoing development on `Dev`. It must never be touched during feature work, intermediate bug fixes, or development iterations.
   - **Production Release Consolidation (Phase 4):** Modified **strictly and only** upon explicit instruction to release to `main`. Consolidates all unreleased entries from `changelog-dev.md` into a user-facing release summary. Development iterations must never appear directly in `changelog.md`.

