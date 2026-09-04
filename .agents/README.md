# Agent Rules & Governance Index 🤖

Welcome to the **Agent Governance Directory** for WhatsNexus. This directory houses the operational rules, behavioral standards, and workflow constraints that govern AI coding agents and human contributors working within this codebase.

All rules are defined as standalone markdown documents in the [`rules/`](rules/) subdirectory.

---

## 📋 Active Rules Index

| Rule | File | Purpose & Mandate |
| :--- | :--- | :--- |
| **Branching & Releases** | [`rules/branching.md`](rules/branching.md) | Enforces development exclusively on `Dev` with mandatory push to `Dev` on every version change. The `main` branch is strictly reserved for user-authorized production releases. |
| **Changelog Maintenance** | [`rules/changelog.md`](rules/changelog.md) | Tracks granular development in `changelog-dev.md` and enforces mandatory version quartet synchronization (`changelog-dev.md`, `package.json`, `package-lock.json`, root `README.md` badge). Restricts modifying `changelog.md` strictly to user-requested pushes to `main`, generating a milestone summary from `changelog-dev.md`. |
| **Documentation Sync** | [`rules/documentation.md`](rules/documentation.md) | Mandates continuous synchronization of `docs/` technical documentation and this `.agents/README.md` index whenever code or rules change. Enforces relative markdown links. |
| **Documentation & Code Language** | [`rules/language.md`](rules/language.md) | Enforces neutral English strictly for all code comments/notes, text files (`.md`, `.txt`), commit messages, and in-app strings without exception. |
| **Semantic Versioning** | [`rules/versioning.md`](rules/versioning.md) | Defines strict SemVer (MAJOR.MINOR.PATCH), mandatory push to `Dev` on every version change, quartet synchronization (`changelog-dev.md`, `package.json`, `package-lock.json`, root `README.md` badge), and commit message format (`"v.<VERSION> <type>: <summary>"`). |

---

## 🔍 Detailed Rule Summaries

### 1. [Git Branching Strategy (`rules/branching.md`)](rules/branching.md)
- **Active Branch:** `Dev` is the default active branch for all feature additions, refactorings, bug fixes, and tests.
- **Mandatory Push to Dev:** Every version change must be committed and pushed immediately to `Dev`.
- **Production Branch:** `main` is protected and only updated when explicitly requested to push to `main` for a release.
- **Branch Parity:** Both `main` and `Dev` must be synced during releases, leaving the agent working on `Dev`.

### 2. [Changelog Management (`rules/changelog.md`)](rules/changelog.md)
- **`changelog-dev.md`:** Updated continuously on every version change on the `Dev` branch, detailing changes under categorized sections (`Added`, `Changed`, `Fixed`, `Performance`).
- **Quartet Parity:** Whenever `changelog-dev.md` is updated with a version, `package.json`, `package-lock.json`, and the root `README.md` version badge must be strictly verified to match the exact same version before committing.
- **`changelog.md` Constraint:** Modified **strictly and only** when the user requests a push to `main`. It must never be touched during normal development.
- **Milestone Summary on Push to Main:** Compiles a high-level, user-facing summary of changes since the last `changelog.md` entry, taking the version entries in `changelog-dev.md` as reference.

### 3. [Documentation Synchronization (`rules/documentation.md`)](rules/documentation.md)
- **Living Documentation:** Any change to architecture, lifecycle, memory, or testing must be immediately reflected in the corresponding files within `docs/`.
- **Rule Index Synchronization:** Whenever a rule is created, updated, or removed in `rules/`, this file ([`.agents/README.md`](README.md)) must be updated.
- **Relative Links:** Absolute local paths (`file:///...` or `/home/...`) are strictly forbidden; only relative Markdown links are permitted.

### 4. [Language Policy (`rules/language.md`)](rules/language.md)
- All notes and comments in code files, text files (`.md`, `.txt`), repository documentation, JSDoc annotations, commit messages, and in-app strings must be authored in English without exception.

### 5. [Semantic Versioning & Commits (`rules/versioning.md`)](rules/versioning.md)
- **SemVer Format:** `MAJOR.MINOR.PATCH` (post-`1.0.0` stable production phase).
- **Increments:** PATCH for backward-compatible fixes and refactors; MINOR for new features; MAJOR for breaking changes.
- **Quartet Parity:** Every version change in `package.json` and `changelog-dev.md` must be immediately matched in `package-lock.json` via `npm install --package-lock-only` and in the root `README.md` badge (`v<VERSION>`).
- **Push to Dev:** Every version change must be pushed to `Dev` (`origin/Dev`).
- **Commit Formatting:** Messages must strictly adhere to `"v.<VERSION> <type>: <summary>"`.
