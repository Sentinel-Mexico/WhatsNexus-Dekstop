# Agent Rules & Governance Index 🤖

Welcome to the **Agent Governance Directory** for WhatsNexus. This directory defines the operational hierarchy, behavioral standards, and workflow constraints that govern AI coding agents and human contributors working within this codebase.

---

## 🏛️ Rule Hierarchy & Precedence

1. **Supreme Authority — Global Governance:**
   All engineering activities are unconditionally governed by the **Global Agent Engineering & Operational Governance** (`antigravity-global-engineering-governance`). Its invariants, workflows, and response protocols hold absolute precedence across all tasks.
2. **Subordinate Extensions — Local Rules (`.agents/rules/`):**
   The local rules housed in `rules/` provide domain-specific specifications (e.g. conlang encodings, modular theme schemas, Electron packaging) that complement and remain strictly subordinate to the Global Governance. Any local clause that contradicts a global directive is void.

---

## 📋 Subordinate Rules Index

| Rule | File | Purpose & Subordinate Mandate |
| :--- | :--- | :--- |
| **Branching & Releases** | [`rules/branching.md`](rules/branching.md) | Enforces active development strictly on `Dev`. Invariant: exactly one push cycle per completed task (no micro-pushes). Production releases to `main` occur strictly on explicit user instruction following the canonical 4-step workflow (Differential Audit, Selective Docs Sync, Release Changelog Compilation, Merge & Return). |
| **Changelog Maintenance** | [`rules/changelog.md`](rules/changelog.md) | Enforces Dual Changelog Integrity (Invariant 3). `changelog-dev.md` captures all active iterations on `Dev`. `changelog.md` is strictly read-only during development and updated solely upon authorized release to `main`. Enforces Version Parity Quartet (Invariant 4). |
| **Documentation Sync** | [`rules/documentation.md`](rules/documentation.md) | Enforces living technical documentation in `docs/` (Phase 2). Mandates proactive documentation sync for affected subsystems, relative markdown links, and selective docs audit during production releases. |
| **Language Policy** | [`rules/language.md`](rules/language.md) | Subordinate to Strict Language Policy (Invariant 6). All code comments, docstrings, text files (`.md`, `.txt`), commits, and engineering artifacts must be written in neutral English. Non-English text is restricted exclusively to `src/locales/`. |
| **Interface Internationalization (i18n)** | [`rules/i18n.md`](rules/i18n.md) | Subordinate to Zero Hardcoded Strings (Invariant 5) and Phase 5. Canonical `src/locales/en.json`, symmetric 100% key parity across all 55+ locales, zero false fallbacks, authentic conlang CSUR encoding (Klingon and Tengwar), and pre-commit audit. |
| **Theme & Palette Categorization** | [`rules/themes.md`](rules/themes.md) | Subordinate to Phase 2 directory standardization (`src/themes/`). Enforces 4-tier visual hierarchy (Own, Custom, Messaging, Pop Culture), internal alphabetical sorting, JSON schema validation, and access control. |
| **Semantic Versioning & Delivery** | [`rules/versioning.md`](rules/versioning.md) | Aligns with Phase 3 (Cumulative Delta Analysis: PATCH, MINOR, MAJOR). Enforces Version Parity Quartet synchronization, single push cycle, standard commit format (`"v.<VERSION> <type>: <summary>"`), and the canonical Output Verification Metadata Block. |

---

## 🔍 Detailed Local Rule Summaries

### 1. [Git Branching Strategy (`rules/branching.md`)](rules/branching.md)
- **Active Branch:** `Dev` is the exclusive branch for all ongoing development. Direct commits to `main` are strictly prohibited.
- **Push Frequency:** Exactly one push cycle per completed task or user prompt. Incremental micro-pushes during intermediate edits are strictly prohibited.
- **Phase 4 Release Workflow:** Executed only upon explicit user instruction via 4 steps: (1) Differential Audit (`git diff --name-only main...Dev`), (2) Selective Documentation Sync, (3) Compile Release Changelog, (4) Merge & Return to `Dev`.

### 2. [Changelog Management (`rules/changelog.md`)](rules/changelog.md)
- **Dual Changelog Integrity:** `changelog-dev.md` logs granular iterations on `Dev`; `changelog.md` is strictly read-only during development and modified exclusively upon release to `main`.
- **Version Parity Quartet:** `package.json`, `package-lock.json`, root `README.md` badge, and latest `changelog-dev.md` header must always maintain 100% parity.

### 3. [Documentation Synchronization (`rules/documentation.md`)](rules/documentation.md)
- **Living Documentation:** Proactively update impacted files in `docs/` within the same work cycle.
- **Relative Links:** Absolute local paths are strictly prohibited; only relative Markdown paths are permitted.
- **Selective Sync on Release:** Update only documentation corresponding to subsystems modified between `main` and `Dev`.

### 4. [Language Policy (`rules/language.md`)](rules/language.md)
- Neutral English is mandatory across all source comments, JSDoc annotations, Markdown documentation, commit messages, and in-app system text. Non-English text is restricted exclusively to dictionary files in `src/locales/`.

### 5. [Semantic Versioning & Delivery (`rules/versioning.md`)](rules/versioning.md)
- **SemVer Format:** `MAJOR.MINOR.PATCH` based on cumulative delta analysis.
- **Quartet Parity:** Lockfile updated via `npm install --package-lock-only`; root `README.md` badge and `changelog-dev.md` header synchronized before committing.
- **Output Protocol:** Every response modifying code or repository state must terminate with the mandatory 5-line Output Verification metadata block.

### 6. [Interface Internationalization & Localization (`rules/i18n.md`)](rules/i18n.md)
- **Zero-Hardcoding:** All UI strings extracted via `data-i18n*` attributes and dynamic JS lookups.
- **Single Source of Truth:** `src/locales/en.json` contains 100% of keys with symmetric parity across all 55+ locales.
- **No False Fallbacks:** English text in foreign locale files is rejected unless on the proper noun/brand whitelist.
- **Conlang Standards:** Klingon CSUR PUA `U+F8D0`–`U+F8FF` and Tengwar CSUR PUA `U+E000`–`U+E07D`.

### 7. [Theme & Color Palette Categorization (`rules/themes.md`)](rules/themes.md)
- **4-Tier Hierarchy:** Own (`whatsnexus`), Custom (`custom`), Messaging (`messaging`), Pop Culture (`pop_culture`), plus `community` fallback.
- **Modular JSON Architecture:** Standalone schemas in `src/themes/<id>.json` with mode tokens, dynamic labels, and internal alphabetical ordering.



