# Git Branching and Release Workflow Rule

> **SUBORDINATION NOTICE:**
> This rule is strictly subordinate to the **Global Agent Engineering & Operational Governance** (`antigravity-global-engineering-governance`). In the event of any conflict, the Global Governance takes absolute precedence.

---

## 1. Active Development Branch (`Dev`)
- **Isolation:** All active engineering, bug fixes, refactorings, feature implementations, and testing belong strictly to the development branch (`Dev`).
- **No Direct Commits to `main`:** The agent must never commit or push directly to `main` without explicit, unambiguous user confirmation.
- **Push Frequency Invariant:** In accordance with Global Invariant 2, **exactly one push cycle per completed task or user prompt** is permitted. Incremental micro-pushes during intermediate code edits or intermediate version bumps are strictly prohibited. The single push to `origin/Dev` occurs only at the conclusion of the requested task.
- **Default Branch State:** The active working branch for the agent must remain `Dev` before, during, and after task execution.

---

## 2. Production Release Procedure to `main` (Phase 4)
A production release is triggered **ONLY** upon explicit, unambiguous instruction from the user (e.g., "release to main", "push to main", "despliega a main").

When authorized, execute the canonical 4-step release pipeline:
1. **Differential Audit:** Run `git diff --name-only main...Dev` to isolate all modified subsystems between the current stable branch and development.
2. **Selective Documentation Sync:** Update only the corresponding files inside `docs/` and root `README.md` that reflect the modified subsystems identified in the differential audit.
3. **Compile Release Changelog:** Consolidate all unreleased entries from `changelog-dev.md` since the last release into a user-facing release summary in `changelog.md`.
4. **Merge & Return:**
   - Checkout `main` and pull latest changes: `git checkout main && git pull origin main`.
   - Merge `Dev` into `main`: `git merge Dev`.
   - Execute push strictly to `origin/main`: `git push origin main`.
   - Switch back immediately to `Dev`: `git checkout Dev` and ensure parity.

