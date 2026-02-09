# Charlie AI Skills

Reusable AI agent skills you can use in **Cursor** (and optionally other tools). Each skill is defined by a `skill.json`; the repo generates `SKILL.md` and Cursor rule files from it.

## Available skills

| Skill | Description |
|-------|-------------|
| [docs-writing](skills/docs-writing/) | Produce clear, discoverable documentation (README, HOWTO, API docs) with consistent structure and markdownlint-clean output. |

## How to use these skills

### In Cursor

1. **Project-level rules (recommended)**  
   Copy the rule file for a skill into your project so Cursor applies it in that repo:
   - Copy `skills/<skill-name>/cursor.rule.md` into your project (e.g. `.cursor/rules/docs-writing.mdc` or into a rule referenced by your Cursor config).
   - Or symlink: `ln -s /path/to/charlie-ai-skills/skills/docs-writing/cursor.rule.md .cursor/rules/docs-writing.mdc`

2. **Reference the skill in chat**  
   In Cursor, you can @-mention the skill file or paste the contents of `SKILL.md` when you want the model to follow that skill (e.g. “when writing docs, follow the guidance in skills/docs-writing/SKILL.md”).

3. **Global / user rules**  
   You can add the contents of `cursor.rule.md` to your user-level Cursor rules so the skill is available in every project.

### In other AI tools

- Use **SKILL.md** as the contract: it lists purpose, triggers, inputs, guarantees, and non-goals. Point your agent at that file when you want “docs writing” (or another skill) behavior.

## Repository structure

```
charlie-ai-skills/
├── skills/
│   └── <skill-name>/
│       ├── skill.json      # Source of truth (edit this)
│       ├── SKILL.md        # Generated from skill.json
│       └── cursor.rule.md  # Generated Cursor rule
├── scripts/
│   ├── generateSkillFiles.js  # skill.json → SKILL.md + cursor.rule.md
│   └── validateSkill.js       # Validate skill.json
├── docs/
│   └── FILE-ROLES.md       # What each file is for (SKILL.md vs CLAUDE.md, etc.)
└── README.md
```

See [docs/FILE-ROLES.md](docs/FILE-ROLES.md) for what each file does and when you need a `CLAUDE.md`.

## Contributing a new skill

1. **Create a skill directory**
   ```bash
   mkdir -p skills/my-skill-name
   ```

2. **Add `skill.json`** in that directory with at least:
   - `id` (e.g. `charlie.my-skill-name`)
   - `title`, `version` (semver `x.y.z`), `description`
   - Optionally: `triggers`, `inputs`, `guarantees`, `non_goals`, `notes`

   Example:
   ```json
   {
     "id": "charlie.my-skill",
     "title": "My Skill",
     "version": "0.1.0",
     "description": "What this skill does.",
     "triggers": ["do X", "help with Y"],
     "guarantees": ["Output does Z"],
     "non_goals": ["Does not do W"],
     "notes": "Prefer foo over bar."
   }
   ```

3. **Validate and generate**
   ```bash
   npm run validate -- skills/my-skill-name/skill.json
   npm run gen
   ```
   This creates/updates `SKILL.md` and `cursor.rule.md` in `skills/my-skill-name/`.

4. **Optional: CLAUDE.md**  
   Only if the skill needs a separate reference doc (patterns, edge cases, long specs). See [docs/FILE-ROLES.md](docs/FILE-ROLES.md).

5. **Commit**  
   Commit `skill.json` and the generated `SKILL.md` and `cursor.rule.md`. Do not edit the generated files by hand; change `skill.json` and run `npm run gen` again.

### Scripts

- `npm run gen` — Regenerate `SKILL.md` and `cursor.rule.md` for every skill under `skills/*/skill.json`. Or pass a single file: `node scripts/generateSkillFiles.js skills/my-skill/skill.json`.
- `npm run validate -- <path>` — Validate a `skill.json` (required fields and semver). Example: `npm run validate -- skills/docs-writing/skill.json`.
- `npm run ci` — Validate and generate (for CI or pre-commit).
