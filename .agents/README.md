# Agent Rules & Governance Index 🤖

Welcome to the **Agent Governance Directory** for WhatsNexus. This directory houses the operational rules, behavioral standards, and workflow constraints that govern AI coding agents and human contributors working within this codebase.

All rules are defined as standalone markdown documents in the [`rules/`](rules/) subdirectory.

---

## 📋 Active Rules Index

| Rule | File | Purpose & Mandate |
| :--- | :--- | :--- |
| **Branching & Releases** | [`rules/branching.md`](rules/branching.md) | Enforces development exclusively on `Dev` with mandatory push to `Dev` on every version change. The `main` branch is strictly reserved for user-authorized production releases, requiring a mandatory audit and synchronization of the root `README.md` and all `/docs` files before pushing. |
| **Changelog Maintenance** | [`rules/changelog.md`](rules/changelog.md) | Tracks granular development in `changelog-dev.md` and enforces mandatory version quartet synchronization (`changelog-dev.md`, `package.json`, `package-lock.json`, root `README.md` badge). Restricts modifying `changelog.md` strictly to user-requested pushes to `main`, generating a milestone summary from `changelog-dev.md`. |
| **Documentation Sync** | [`rules/documentation.md`](rules/documentation.md) | Mandates continuous synchronization of `docs/` technical documentation, root `README.md` review upon push to `main`, and this `.agents/README.md` index whenever code or rules change. Enforces relative markdown links. |
| **Documentation & Code Language** | [`rules/language.md`](rules/language.md) | Enforces neutral English strictly for all code comments/notes, text files (`.md`, `.txt`), commit messages, and in-app strings without exception. |
| **Interface Internationalization (i18n)** | [`rules/i18n.md`](rules/i18n.md) | Enforces zero-hardcoding (`data-i18n*`), strict 100% key parity across all 55+ locales with canonical `en.json`, strict prohibition of English fallback/placeholders in foreign locales, authentic conlang CSUR encoding, dropdown deduplication, and pre-commit audit. |
| **Theme & Palette Categorization** | [`rules/themes.md`](rules/themes.md) | Mandates strict 4-category hierarchy for all theme palettes (Own, Original, Messaging, Pop Culture) with internal alphabetical sorting in each category, and enforces alphabetical placement for future additions. |
| **Semantic Versioning** | [`rules/versioning.md`](rules/versioning.md) | Defines strict SemVer (MAJOR.MINOR.PATCH), mandatory push to `Dev` on every version change, quartet synchronization (`changelog-dev.md`, `package.json`, `package-lock.json`, root `README.md` badge), and commit message format (`"v.<VERSION> <type>: <summary>"`). |

---

## 🔍 Detailed Rule Summaries

### 1. [Git Branching Strategy (`rules/branching.md`)](rules/branching.md)
- **Active Branch:** `Dev` is the default active branch for all feature additions, refactorings, bug fixes, and tests.
- **Mandatory Push to Dev:** Every version change must be committed and pushed immediately to `Dev`.
- **Production Branch:** `main` is protected and only updated when explicitly requested to push to `main` for a release.
- **Mandatory README & Docs Audit on Push to Main:** Every push/release to `main` obligates inspecting the root `README.md` and all files in `/docs` to ensure they 100% reflect and agree with all changes before releasing.
- **Branch Parity:** Both `main` and `Dev` must be synced during releases, leaving the agent working on `Dev`.

### 2. [Changelog Management (`rules/changelog.md`)](rules/changelog.md)
- **`changelog-dev.md`:** Updated continuously on every version change on the `Dev` branch, detailing changes under categorized sections (`Added`, `Changed`, `Fixed`, `Performance`).
- **Quartet Parity:** Whenever `changelog-dev.md` is updated with a version, `package.json`, `package-lock.json`, and the root `README.md` version badge must be strictly verified to match the exact same version before committing.
- **`changelog.md` Constraint:** Modified **strictly and only** when the user requests a push to `main`. It must never be touched during normal development.
- **Milestone Summary on Push to Main:** Compiles a high-level, user-facing summary of changes since the last `changelog.md` entry, taking the version entries in `changelog-dev.md` as reference.

### 3. [Documentation Synchronization (`rules/documentation.md`)](rules/documentation.md)
- **Living Documentation:** Any change to architecture, lifecycle, memory, or testing must be immediately reflected in the corresponding files within `docs/`.
- **Mandatory Audit on Push to Main:** Inspect root `README.md` and all files in `docs/` on every release to `main` to ensure zero drift with the codebase.
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

### 6. [Interface Internationalization & Localization (`rules/i18n.md`)](rules/i18n.md)
- **Zero-Hardcoding:** All user-facing strings must use `data-i18n*` attributes in HTML and dynamic lookups in JS.
- **Single Source of Truth:** `src/locales/en.json` is the canonical reference containing 100% of keys.
- **Symmetric 100% Key Parity:** Every supported locale in `src/locales/*.json` must match `en.json` keys exactly.
- **Strict Anti-Fallback Mandate:** Copying English text into non-English locales is strictly forbidden; all strings must be genuinely translated (brand names and proper nouns are the sole exceptions).
- **Conlang Standards:** Klingon (`tlh.json` / `klingon.json`) must use CSUR PUA `U+F8D0`–`U+F8FF`; Tengwar (`tengwar.json`) must use CSUR PUA `U+E000`–`U+E07D`.
- **Selector Deduplication:** Languages must be registered strictly once in `supportedLanguages` and `nativeNames` in `src/renderer/renderer.js`.
- **Pre-Commit Audit:** Agents must run automated parity and fallback checks before delivering localization updates.

### 7. [Theme & Color Palette Categorization (`rules/themes.md`)](rules/themes.md)
- **Hierarchy Structure:** Themes must follow the 4-tier hierarchy: Application Own (WhatsNexus), Custom/Original (Alto Contraste, Bosque, Dracula, Nord, Retro, Steampunk), Messaging (Messenger, Signal, Telegram, WhatsApp), and Pop Culture (Star Wars).
- **Internal Alphabetical Sorting:** Each category block must strictly maintain alphabetical ordering of its palette entries.
- **Alphabetical Insertion Rule:** When a new palette is added, it must be placed in its proper category and in its exact alphabetical order within that category block.
- **Design Tokens & Parity:** Every palette requires complete light/dark CSS tokens, dynamic label mapping in `updateThemeLabels()`, and 100% translation coverage across all 55 locale files.


