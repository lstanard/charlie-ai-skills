# AI Skills

Reusable, and highly-opinionated, AI agent skills you can use in **Cursor**, **Claude**, and optionally other tools. Each skill is defined by a `skill.json`; the repo generates `SKILL.md` and Cursor rule files from it.

## Available skills

| Skill                                                                        | Description                                                                                                                  |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| [general-coding-rules](skills/general-coding-rules/)                         | Universal rules that apply to all code regardless of language or context.                                                    |
| [docs-writing](skills/docs-writing/)                                         | Produce clear, discoverable documentation (README, HOWTO, API docs) with consistent structure and markdownlint-clean output. |
| [error-handling](skills/error-handling/)                                     | Structured error handling: custom error classes, error codes, logging, user-facing vs internal errors, graceful degradation. |

### Testing skills

| Skill                                                                  | Description                                                                                                                            |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| [react-component-testing](skills/testing/react-component-testing/)     | Test React components with React Testing Library: accessible queries, behavior over implementation, Jest/Vitest.                       |
| [accessibility-testing](skills/testing/accessibility-testing/)         | Test a11y with jest-axe, keyboard navigation, screen readers, ARIA patterns. WCAG/ADA compliance. Works with React and E2E.           |
| [mock-data-strategy](skills/testing/mock-data-strategy/)               | Use factories (Fishery) and faker for consistent, overridable test data. Keep test fixtures DRY and realistic.                        |
| [graphql-testing](skills/testing/graphql-testing/)                     | Mock GraphQL with MockedProvider or MSW; match by operation and variables; schema-aware mocks for large schemas.                       |
| [e2e-playwright](skills/testing/e2e-playwright/)                       | End-to-end testing with Playwright: Page Object Model, critical paths, CI parallelization, visual regression.                          |
| [test-reliability](skills/testing/test-reliability/)                   | Prevent flaky tests: proper async handling, test isolation, deterministic data, performance optimization.                              |
| [test-observability](skills/testing/test-observability/)               | Monitor test suite health: flake rates, duration trends, CI optimization, coverage reporting (Codecov). SRE-focused.                   |

The **testing** skills share a [CLAUDE.md](skills/testing/CLAUDE.md) with universal testing principles: test pyramid, anti-patterns, file organization, and best practices. Use that doc when applying several of these skills together.

### Frontend architecture skills

| Skill                                                                        | Description                                                                                                                  |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| [react-layering](skills/frontend-architecture/react-layering/)               | Apply Presentation–Domain–Data layering; keep React as the view layer only.                                                  |
| [react-view-extraction](skills/frontend-architecture/react-view-extraction/) | Extract hooks for state/effects, sub-components; prefer pure presentational components.                                      |
| [react-domain-models](skills/frontend-architecture/react-domain-models/)     | Encapsulate mapping and business rules in domain objects; avoid logic leaks in the view.                                     |
| [react-data-layer](skills/frontend-architecture/react-data-layer/)           | Extract network/data access into a dedicated client; no fetch in components.                                                 |
| [react-polymorphism](skills/frontend-architecture/react-polymorphism/)       | Use strategy/polymorphism for varying behavior; avoid shotgun surgery with conditionals.                                     |

The **frontend architecture** skills are based on [Modularizing React Applications with Established UI Patterns](https://martinfowler.com/articles/modularizing-react-apps.html) and share a [CLAUDE.md](skills/frontend-architecture/CLAUDE.md) with reference knowledge (evolution path, patterns, pitfalls). Use that doc when applying several of these skills together.

---

**💡 Looking for more skills?** See [Future Skill Recommendations](docs/FUTURE-SKILLS.md) for planned additions (API design, security fundamentals, AWS patterns, and more).

## How to use these skills

### Personal vs Project Skills

Skills are **copied by default**. Use `--link` to symlink instead.

**Project skills** - Copy and commit to git:

```bash
# From the skills repo, install to your project
npm run install:cursor -- ~/Code/my-app
npm run install:claude -- ~/Code/my-app

# Then commit the skills in your project
cd ~/Code/my-app
git add .cursor/skills/  # or .claude/skills/
git commit -m "Add AI coding skills"
```

This ensures team consistency and deterministic behavior. Update by re-running the install command and committing changes.

**Personal skills** - Symlink for automatic updates:

```bash
# Install globally (available across all projects)
npm run install:cursor -- ~/.cursor --link
npm run install:claude -- ~/.claude --link
```

Symlinked skills stay up to date with this repo. Don't commit symlinks to project repositories.

---

### In Claude Code

**Install globally** (available across all projects):
```bash
npm run install:claude -- ~/.claude --link
```

**Install to a project** (team-shared, committed to git):
```bash
npm run install:claude -- ~/Code/my-app
```

**Options:**
- `--link` - Symlink instead of copy (for personal/global installs)
- `skills/testing` - Install specific skill group (second positional arg)
- `--include-claude` - Also install CLAUDE.md reference files

**Use in conversation:**
Claude Code automatically discovers skills. Reference by name:
```
@react-component-testing write tests for LoginForm
@accessibility-testing check UserProfile for a11y issues
```

### In Cursor

**Install globally** (available across all projects):
```bash
npm run install:cursor -- ~/.cursor --link
```

**Install to a project** (team-shared, committed to git):
```bash
npm run install:cursor -- ~/Code/my-app
```

**Options:**
- `--link` - Symlink instead of copy (for personal/global installs)
- `skills/testing` - Install specific skill group (second positional arg)
- `--include-claude` - Also install CLAUDE.md reference files

**Use in conversation:**
Cursor automatically discovers skills. Reference by name:
```
@react-component-testing write tests for LoginForm
@accessibility-testing check UserProfile for a11y issues
```

### In other AI tools

- Use **SKILL.md** as the contract: it lists purpose, triggers, inputs, guarantees, and non-goals. Point your agent at that file when you want specific skill behavior.

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
- `npm run install:cursor -- <destination> [source-path] [options]` — Install skills for Cursor (copied by default).
  - `--link, -l` — Symlink instead of copy
  - `--include-claude` — Also install CLAUDE.md reference files
  - Second positional arg for source path (e.g., `skills/testing`)
- `npm run install:claude -- <destination> [source-path] [options]` — Install skills for Claude Code (copied by default). Same options as above.
- `npm run ci` — Validate and generate (for CI or pre-commit).
