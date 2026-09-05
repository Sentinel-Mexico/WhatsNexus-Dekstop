# Commit Conventions, Versioning & Release Rules

To maintain high development velocity, flawless audit trails, and strict release stability, WhatsNexus enforces automated rules for versioning, commit message formatting, Git branching, and changelog maintenance.

---

## 1. Semantic Versioning (SemVer)

WhatsNexus strictly follows Semantic Versioning in the standard format:
```text
MAJOR.MINOR.PATCH  (e.g., 0.5.2)
```

### 1.1 Production Milestone (`1.x.x`)
With the release of `1.0.0`, WhatsNexus has completed its beta/initial development phase and entered production stability:
- **PATCH** increments (e.g., `1.0.0` $\rightarrow$ `1.0.1`) are used for bug fixes, platform compatibility patches, styling adjustments, and minor refactorings.
- **MINOR** increments (e.g., `1.0.0` $\rightarrow$ `1.1.0`) are used for backward-compatible new features, newly integrated locales, or additional settings modules.
- **MAJOR** increments (e.g., `1.0.0` $\rightarrow$ `2.0.0`) are reserved for breaking architectural overhauls or foundational migrations.

### 1.2 Increment Triggers

| Increment | Trigger Criteria | Typical Examples |
| :--- | :--- | :--- |
| **PATCH** | Backward-compatible modifications that do not add public API or alter foundational workflows. | Bug fixes, platform compatibility patches, styling adjustments, internal refactorings, documentation additions. |
| **MINOR** | New functionality or user-facing features introduced in a backward-compatible manner. | New settings pane, support for a new language/locale, new splash screen, account export feature. |
| **MAJOR** | Breaking changes, core architecture replacements, or major overhauls. | Switching UI frameworks, backwards-incompatible database/localStorage migrations. |

### 1.3 Version Synchronization Rule (The Version Quartet)
Whenever the project version changes, it must be simultaneously synchronized across the **Version Quartet**:
1. `package.json` (`version` property)
2. `package-lock.json` (`version` and packages root entry)
3. Root `README.md` (version badge and textual version references)
4. `changelog-dev.md` (new release entry with date and categorized changes)

During ongoing development on the `Dev` branch, `changelog.md` MUST NOT be modified; it is exclusively updated during stable release promotions to `main`.

---

## 2. Commit Message Specification

Every Git commit must follow a standardized format that starts with the current project version:

```text
"v.<VERSION> <type>: <summary>"
```

### 2.1 Allowed Types
- **`feat`**: A new user-facing feature or enhancement.
- **`fix`**: A bug fix or platform compatibility correction.
- **`refactor`**: Code restructuring without feature addition or bug correction.
- **`perf`**: Performance, RAM reduction, or throttling improvements.
- **`docs`**: Documentation additions or updates (`README`, `docs/`, inline comments).
- **`style`**: CSS formatting, themes, visual tokens, and micro-animations.
- **`test`**: Adding or updating syntax, unit, or integration tests.
- **`chore`**: Maintenance tasks, package upgrades, or tool configurations.

### 2.2 Examples
```bash
git commit -m "v.0.5.0 feat: add Stacer-inspired splash screen with loading progress bar"
git commit -m "v.0.5.1 refactor: transform settings modal into dedicated full-window view"
git commit -m "v.0.5.2 fix: disable WaylandWpColorManagerV1 to resolve Wayland color management errors"
```

---

## 3. Git Branching Strategy

The repository follows a two-tier branching model:

```text
  main (Production / Stable Releases)
   ^
   | [Explicit Release Merges Only]
   |
  Dev  (Active Development & Ongoing Features)
```

1. **Development Branch (`Dev`):**
   - The default working branch for all active code, patches, refactors, and feature additions.
   - All feature branches or direct commits must target `Dev`.
2. **Production / Stable Branch (`main`):**
   - Strictly reserved for stable, tagged releases.
   - Pushing or merging directly to `main` without explicit release authorization is prohibited.
   - Merging from `Dev` into `main` occurs only upon official stable milestone deployment.
   - **Mandatory Documentation Audit on Push to `main`:** Every time a push or release to `main` is performed, the maintainer/agent must obligatorily audit the root `README.md` and all files in `/docs` to ensure they 100% reflect and agree with all changes before completing the push.

---

## 4. Changelog Maintenance Rules

The project maintains two distinct changelogs written in neutral English:

1. **Development Changelog (`changelog-dev.md`):**
   - Documents granular version updates applied directly on the `Dev` branch.
   - Updated continuously every time `package.json` version is incremented.
   - Classified by change type (`Added`, `Changed`, `Fixed`, `Performance`).
2. **Stable Release Changelog (`changelog.md`):**
   - Maintained exclusively for high-level release summaries when `Dev` is merged into `main`.
   - Outlines the consolidated milestones and user-facing benefits between stable releases.

---

## 5. Neutral English Language Policy

As specified in `.agents/rules/language.md`, all project files, code comments, JSDoc annotations, commit messages, documentation articles, and in-app system text must be authored strictly in neutral English.
