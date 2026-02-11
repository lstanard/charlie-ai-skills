# Charlie AI Skills

Reusable AI agent skills you can use in **Cursor** (and optionally other tools). Each skill is defined by a `skill.json`; the repo generates `SKILL.md` and Cursor rule files from it.

## Available skills

| Skill                                                                        | Description                                                                                                                  |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| [general-coding-rules](skills/general-coding-rules/)                         | Universal rules that apply to all code regardless of language or context.                                                    |
| [docs-writing](skills/docs-writing/)                                         | Produce clear, discoverable documentation (README, HOWTO, API docs) with consistent structure and markdownlint-clean output. |
| [react-layering](skills/frontend-architecture/react-layering/)               | Apply Presentation–Domain–Data layering; keep React as the view layer only.                                                  |
| [react-view-extraction](skills/frontend-architecture/react-view-extraction/) | Extract hooks for state/effects, sub-components; prefer pure presentational components.                                      |
| [react-domain-models](skills/frontend-architecture/react-domain-models/)     | Encapsulate mapping and business rules in domain objects; avoid logic leaks in the view.                                     |
| [react-data-layer](skills/frontend-architecture/react-data-layer/)           | Extract network/data access into a dedicated client; no fetch in components.                                                 |
| [react-polymorphism](skills/frontend-architecture/react-polymorphism/)       | Use strategy/polymorphism for varying behavior; avoid shotgun surgery with conditionals.                                     |

The **frontend architecture** skills (react-layering through react-polymorphism) are based on [Modularizing React Applications with Established UI Patterns](https://martinfowler.com/articles/modularizing-react-apps.html) and share a [CLAUDE.md](skills/frontend-architecture/CLAUDE.md) with reference knowledge (evolution path, patterns, pitfalls). Use that doc when applying several of these skills together.

## How to use these skills

### In Cursor

1. **Project-level rules (recommended)**  
   Copy the rule file for a skill into your project so Cursor applies it in that repo:
   - Use the install script (recommended): from this repo, run `npm run install-skills -- /path/to/your-app skills/frontend-architecture` to copy all frontend-architecture skills as `react-data-layer.mdc`, `react-layering.mdc`, etc. Add `--link` to symlink instead of copy.
   - Or copy manually: `skills/<skill-name>/cursor.rule.md` → `.cursor/rules/<skill-name>.mdc`.

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
│   ├── <skill-name>/
│   │   ├── skill.json      # Source of truth (edit this)
│   │   ├── SKILL.md        # Generated from skill.json
│   │   └── cursor.rule.md  # Generated Cursor rule
│   └── <group>/            # Optional: nested group (e.g. frontend-architecture/)
│       ├── CLAUDE.md       # Optional: shared reference knowledge for the group
│       └── <sub-skill>/
│           ├── skill.json
│           ├── SKILL.md
│           └── cursor.rule.md
├── scripts/
│   ├── generateSkillFiles.js  # skill.json → SKILL.md + cursor.rule.md
│   ├── installSkills.js       # Copy rules to project .cursor/rules/ with clear names
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

- `npm run gen` — Regenerate `SKILL.md` and `cursor.rule.md` for every skill (discovers `skill.json` recursively under `skills/`). Or pass a single file: `node scripts/generateSkillFiles.js skills/my-skill/skill.json`.
- `npm run validate -- <path>` — Validate a `skill.json` (required fields and semver). Example: `npm run validate -- skills/docs-writing/skill.json`.
- `npm run install-skills -- <destination> [source-path] [--link] [--include-claude]` — Copy Cursor rules into a project's `.cursor/rules/` with descriptive names (e.g. `react-data-layer.mdc`). Example: `npm run install-skills -- /path/to/my-app skills/frontend-architecture --include-claude`.
- `npm run ci` — Validate and generate (for CI or pre-commit).
