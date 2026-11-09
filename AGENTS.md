# Working in this repository

This repository maintains reusable skills for Cursor, Claude Code, and Codex.

- Edit `skills/**/skill.json` as the source of truth. `SKILL.md` and `cursor.rule.md` are generated; run `npm run gen` after changing skill JSON.
- Keep the README skill tables in sync when adding skills or changing their descriptions.
- Supporting `CLAUDE.md` files contain maintained skill reference knowledge. Their filenames are shared across harnesses; read them explicitly when working on the associated skill. Group references live in `skills/testing/` and `skills/frontend-architecture/`.
- Run `npm run ci` to validate metadata, regenerate files, and test installation. Installer tests use temporary directories.
- Codex installation uses `.agents/skills/`, includes group references and examples, and adds compatibility guidance to installed copies. Keep generated source manifests portable across harnesses.
- Keep Superpowers-generated documents and implementation plans out of version control. Use an ignored workspace or a temporary directory; never force-add these artifacts. Commit maintained skill definitions and reference knowledge only.
