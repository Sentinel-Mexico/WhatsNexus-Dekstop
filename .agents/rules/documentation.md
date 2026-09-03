# Documentation Synchronization and Maintenance Rule

## 1. Living Documentation Mandate
The technical documentation stored in the `docs/` directory is an essential, first-class citizen of the repository. It must accurately represent the current state of the application at all times.

## 2. Continuous Synchronization Trigger
Whenever the agent performs any code modification, feature addition, UI refactoring, architectural update, behavioral change, or deprecation:
1. **Impact Assessment:** The agent must evaluate whether the modifications affect existing architecture, lifecycle flows, memory management, testing routines, or operational guides documented in `docs/`.
2. **Proactive Updates:** If any documented component or procedure is modified, rendered obsolete, or expanded, the agent must proactively update, create, or delete the corresponding `.md` files in `docs/` as part of the same work cycle.
3. **No Lagging Documentation:** Code and documentation must never drift apart. Delivering updated code without synchronizing impacted documentation is considered incomplete work.

## 3. Relative Linking Rule
All markdown links between documentation files, repository files, and root README files must strictly use **relative paths** (e.g., `[Architecture](architecture.md)` or `[Docs](docs/README.md)`).
- **Prohibited:** Never hardcode absolute system paths or local URL schemes (such as `file:///home/...` or `C:\...`) in repository documentation.
- **Guarantee:** Documentation must remain fully functional and navigable on remote Git web interfaces (e.g., GitHub.com) as well as across any contributor's local machine.

## 4. Language Consistency
In accordance with `.agents/rules/language.md`, all documentation articles, guides, tables, and diagrams created or edited within `docs/` must strictly be written in neutral English.
