# Semantic Versioning (SemVer) & Delivery Rule

> **SUBORDINATION NOTICE:**
> This rule is strictly subordinate to the **Global Agent Engineering & Operational Governance** (`antigravity-global-engineering-governance`). In the event of any conflict, the Global Governance takes absolute precedence.

---

## 1. Cumulative Delta Analysis (Phase 3)
At the conclusion of the requested task, assess all changes across the codebase to determine the increment applied to the primary Version Authority File (`package.json`):

- **PATCH:** Backward-compatible fixes, performance refactors, UI adjustments, documentation sync. Format: `X.Y.Z` $\rightarrow$ `X.Y.(Z+1)`.
- **MINOR:** Backward-compatible features, new locales, new settings tabs, new API integrations. Resets PATCH to 0. Format: `X.Y.Z` $\rightarrow$ `X.(Y+1).0`.
- **MAJOR:** Breaking changes, architectural overhauls, schema redesigns. Resets MINOR and PATCH to 0. Format: `X.Y.Z` $\rightarrow$ `(X+1).0.0`.

---

## 2. Version Parity Quartet Synchronization (Global Invariant 4)
The version string across the following 4 files must always maintain 100% parity before committing:
1. **Version Authority File:** `package.json` (`version` field).
2. **Lockfile:** `package-lock.json` (`version` and root packages entry, updated via `npm install --package-lock-only`).
3. **README Badge:** Root `README.md` version badge (`![Version](https://img.shields.io/badge/version-v<VERSION>-brightgreen.svg)`).
4. **Development Changelog:** Latest header in `changelog-dev.md` (`## [<VERSION>] - YYYY-MM-DD`).

---

## 3. Commit & Push Cycle
- **Commit Prefix Format:** `"v.<VERSION> <type>: <summary>"` (e.g., `"v.2.0.2 fix: assign explicit high-res icon to all windows"`).
- **Allowed Types:** `feat`, `fix`, `refactor`, `perf`, `docs`, `style`, `test`, `chore`.
- **Single Push Cycle (Global Invariant 2):** Exactly one push cycle per completed task or user prompt. Incremental micro-pushes during intermediate code edits are strictly prohibited. The push is executed strictly to `origin/Dev`.

---

## 4. Output Verification & Response Protocol (Global Section 5)
Every response that introduces code, file modifications, or repository operations must conclude with the following canonical metadata block:

```text
* Increment Applied: [Patch | Minor | Major | None]
* Rationale: <detailed explanation of changes and architectural impact>
* Quartet Sync Status: [Synchronized | N/A]
* Documentation Audit: [Updated (<file1>, <file2>) | No delta required]
* Git Branch Status: [Active on dev | Pushed to dev | Released to main]
```

