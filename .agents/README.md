# Agent Rules & Governance Index 🤖

Welcome to the **Agent Governance Directory** for WhatsNexus. This directory houses the operational rules, behavioral standards, and workflow constraints that govern AI coding agents and human contributors working within this codebase.

All rules are defined as standalone markdown documents in the [`rules/`](rules/) subdirectory.

---

## 📋 Active Rules Index

| Rule | File | Purpose & Mandate |
| :--- | :--- | :--- |
| **Branching & Releases** | [`rules/branching.md`](rules/branching.md) | Enforces development exclusively on the `Dev` branch. The `main` branch is strictly reserved for production releases authorized by the user. |
| **Changelog Maintenance** | [`rules/changelog.md`](rules/changelog.md) | Separates granular development tracking in `changelog-dev.md` from high-level stable release milestones in `changelog.md`. |
| **Documentation Sync** | [`rules/documentation.md`](rules/documentation.md) | Mandates continuous synchronization of `docs/` technical documentation and this `.agents/README.md` index whenever code or rules change. Enforces relative markdown links. |
| **Documentation Language** | [`rules/language.md`](rules/language.md) | Enforces neutral English for all documentation, inline comments, markdown files, commit messages, and in-app text. |
| **Semantic Versioning** | [`rules/versioning.md`](rules/versioning.md) | Defines strict SemVer (MAJOR.MINOR.PATCH), lockfile synchronization (`npm install`), and standardized commit message formatting (`"v.<VERSION> <type>: <summary>"`). |

---

## 🔍 Detailed Rule Summaries

### 1. [Git Branching Strategy (`rules/branching.md`)](rules/branching.md)
- **Active Branch:** `Dev` is the default active branch for all feature additions, refactorings, bug fixes, and tests.
- **Production Branch:** `main` is protected and only updated when merging `Dev` during an explicit, user-authorized release.
- **Branch Parity:** Both `main` and `Dev` must be synced during releases, leaving the agent working on `Dev`.

### 2. [Changelog Management (`rules/changelog.md`)](rules/changelog.md)
- **`changelog-dev.md`:** Updated continuously on every version change on the `Dev` branch, detailing changes under categorized sections (`Added`, `Changed`, `Fixed`, `Performance`).
- **`changelog.md`:** Updated only during stable production releases to `main`, providing a consolidated, user-facing summary of milestone improvements.

### 3. [Documentation Synchronization (`rules/documentation.md`)](rules/documentation.md)
- **Living Documentation:** Any change to architecture, lifecycle, memory, or testing must be immediately reflected in the corresponding files within `docs/`.
- **Rule Index Synchronization:** Whenever a rule is created, updated, or removed in `rules/`, this file ([`.agents/README.md`](README.md)) must be updated.
- **Relative Links:** Absolute local paths (`file:///...` or `/home/...`) are strictly forbidden; only relative Markdown links are permitted.

### 4. [Language Policy (`rules/language.md`)](rules/language.md)
- All repository documentation, code comments, JSDoc annotations, commit messages, and default in-app strings must be authored in neutral English.

### 5. [Semantic Versioning & Commits (`rules/versioning.md`)](rules/versioning.md)
- **SemVer Format:** `MAJOR.MINOR.PATCH` (currently in `0.x.x` beta phase).
- **Increments:** PATCH for backward-compatible fixes and refactors; MINOR for new features; MAJOR for breaking changes.
- **Lockfile Synchronization:** Every version change in `package.json` must be immediately followed by `npm install` to synchronize `package-lock.json`.
- **Commit Formatting:** Messages must strictly adhere to `"v.<VERSION> <type>: <summary>"`.
