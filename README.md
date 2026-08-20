# AI Skills

Reusable, and highly-opinionated, AI agent skills you can use in **Cursor**, **Claude**, and optionally other tools. Each skill is defined by a `skill.json`; the repo generates `SKILL.md` and Cursor rule files from it.

## Available skills

| Skill                                                                        | Description                                                                                                                  |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| [general-coding-rules](skills/general-coding-rules/)                         | Universal rules that apply to all code regardless of language or context.                                                    |
| [typescript-conventions](skills/typescript-conventions/)                     | TypeScript-specific style and structure rules: barrel exports, strict typing, type safety patterns.                          |
| [docs-writing](skills/docs-writing/)                                         | Produce clear, discoverable documentation (README, HOWTO, API docs) with consistent structure and markdownlint-clean output. |
| [error-handling](skills/error-handling/)                                     | Structured error handling: custom error classes, error codes, logging, user-facing vs internal errors, graceful degradation. |
| [skill-maintenance](skills/skill-maintenance/)                               | Keep the skills repo consistent: update README.md and run codegen whenever a skill is added or changed.                     |
| [frontend-performance-audit](skills/frontend-performance-audit/)             | Run Lighthouse against a production build after completing any frontend feature, iterate on fixes until thresholds pass, and commit a score summary to git. |
| [jsdoc](skills/jsdoc/)                                                       | Enforce JSDoc comments on all JS/TS functions, methods, classes, and named arrow functions — both when writing new code and when modifying existing code. |
| [quiz-me](skills/quiz-me/)                                                   | Run an interactive comprehension quiz on code just produced or discussed, scored across mechanics, design rationale, operations, and big picture. |
| [pr-size-guard](skills/pr-size-guard/)                                       | Flag changes likely to become an oversized PR (plan-time, mid-coding, or on demand) and propose a concrete split before they grow further. |
| [explain-simply](skills/explain-simply/)                                     | Reframe the most recent explanation in plain, concrete language when the user signals it didn't land (e.g. "I'm a stupid baby", "dumb it down", "ELI5"). |
| [branch-review](skills/branch-review/)                                       | Review the currently checked-out branch against the default branch and report findings locally — never posts anywhere, never edits code. |
| [grill-me](skills/grill-me/)                                                 | Interrogate a plan as a decision tree, one question at a time, with no recommended answer — hardens a plan-mode plan before implementation starts. |
| [sdlc](skills/sdlc/)                                                         | Run the full lifecycle from a Jira ticket to a green CI run — plan, TDD, AC gate, scope-informed code review depth confirmed with the user, size guard, teach-back quiz, then commit/push/PR on request. No Jira status changes, no PR comments, no merge. |
| [standup-summary](skills/standup-summary/)                                  | Generate a concise yesterday/today/blockers standup message from your actual Jira and GitHub activity, scoped account-wide. Chat output only, entirely read-only. |
| [work-log](skills/work-log/)                                                | Keep a personal, high-level log of completed work — explicit or proactive entries, on-demand Jira/GitHub backfill, synthesized weekly/monthly/yearly review. |

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
| [css-architecture](skills/frontend-architecture/css-architecture/)                       | CSS Modules + two-layer design token system (primitive + semantic); camelCase naming; no BEM; avoid CSS-in-JS.               |
| [frontend-performance](skills/frontend-architecture/frontend-performance/)               | Measure first. Core Web Vitals, bundle analysis, code splitting, asset optimization, and React rendering fixes for Vite SPAs. |
| [routing-and-navigation](skills/frontend-architecture/routing-and-navigation/)           | URLs are UX. Link vs button semantics, URL-based filter/pagination state, external link safety, and programmatic navigation rules. |
| [react-layering](skills/frontend-architecture/react-layering/)               | Apply Presentation–Domain–Data layering; keep React as the view layer only.                                                  |
| [react-view-extraction](skills/frontend-architecture/react-view-extraction/) | Extract hooks for state/effects, sub-components; prefer pure presentational components.                                      |
| [react-domain-models](skills/frontend-architecture/react-domain-models/)     | Encapsulate mapping and business rules in domain objects; avoid logic leaks in the view.                                     |
| [react-data-layer](skills/frontend-architecture/react-data-layer/)           | Extract network/data access into a dedicated client; no fetch in components.                                                 |
| [react-polymorphism](skills/frontend-architecture/react-polymorphism/)       | Use strategy/polymorphism for varying behavior; avoid shotgun surgery with conditionals.                                     |

The **frontend architecture** skills are based on [Modularizing React Applications with Established UI Patterns](https://martinfowler.com/articles/modularizing-react-apps.html) and share a [CLAUDE.md](skills/frontend-architecture/CLAUDE.md) with reference knowledge (evolution path, patterns, pitfalls). Use that doc when applying several of these skills together.

---

**💡 Looking for more skills?** See [Future Skill Recommendations](docs/FUTURE-SKILLS.md) for planned additions (API design, security fundamentals, AWS patterns, and more).

## How to use these skills

### Scope and tags

Each skill has a `scope` and optional `tags` in its `skill.json`:

- **`scope: "global"`** — install once to `~/.claude` or `~/.cursor`; these apply across all projects (e.g. agent tone, coding rules)
- **`scope: "project"`** — install per project; use `--tags` to narrow to what's relevant

Available tags: `frontend`, `react`, `typescript`, `javascript`, `testing`, `graphql`

Skills with no tags are installed whenever `--scope=project` is used. Skills with tags are only installed when at least one of their tags is requested.

### Dependencies

A skill can declare two kinds of dependency in `skill.json`:

- **`dependencies`** — slugs of other skills in this repo (e.g. `sdlc` depends on `grill-me`, `pr-size-guard`, `quiz-me`). `installSkills.js` installs these alongside the depending skill automatically, regardless of `--scope`/`--tags`, so a skill's own runtime requirements are never left uninstalled by accident.
- **`plugin_dependencies`** — skills that come from an external plugin (e.g. `superpowers:brainstorming`). This repo can't install another plugin's skills, so the installer just prints them as a reminder to install separately.

### In Claude Code

**Install global skills** (once, applies to all projects):
```bash
npm run install:claude -- ~/.claude --scope=global
```

**Install project skills** (committed to git, scoped to stack):
```bash
# Frontend React project
npm run install:claude -- ~/Code/my-app --scope=project --tags=frontend,react

# TypeScript project (no frontend)
npm run install:claude -- ~/Code/my-app --scope=project --tags=typescript

# All project skills (no tag filter)
npm run install:claude -- ~/Code/my-app --scope=project
```

**Re-sync a single skill after updating it:**
```bash
npm run install:claude -- ~/.claude skills/general-coding-rules
```

**Options:**
- `--scope=global|project` — filter by scope
- `--tags=tag1,tag2` — filter by tag (any match); untagged skills always pass
- `--include-claude` — also install CLAUDE.md reference files

**Use in conversation:**
Claude Code automatically discovers skills. Reference by name:
```
@react-component-testing write tests for LoginForm
@accessibility-testing check UserProfile for a11y issues
```

### In Cursor

**Install global skills** (once, applies to all projects):
```bash
npm run install:cursor -- ~/.cursor --scope=global
```

**Install project skills** (committed to git, scoped to stack):
```bash
# Frontend React project
npm run install:cursor -- ~/Code/my-app --scope=project --tags=frontend,react

# TypeScript project (no frontend)
npm run install:cursor -- ~/Code/my-app --scope=project --tags=typescript

# All project skills (no tag filter)
npm run install:cursor -- ~/Code/my-app --scope=project
```

**Re-sync a single skill after updating it:**
```bash
npm run install:cursor -- ~/.cursor skills/general-coding-rules
```

**Options:**
- `--scope=global|project` — filter by scope
- `--tags=tag1,tag2` — filter by tag (any match); untagged skills always pass
- `--include-claude` — also install CLAUDE.md reference files

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
   - Optionally: `dependencies` (slugs of other skills in this repo this one requires — see [Dependencies](#dependencies)), `plugin_dependencies` (required skills from an external plugin, printed as a reminder at install time)

   Example:

   ```json
   {
     "scope": "project",
     "tags": ["frontend", "react"],
     "id": "charlie.my-skill",
     "title": "My Skill",
     "version": "0.1.0",
     "description": "What this skill does.",
     "triggers": ["do X", "help with Y"],
     "guarantees": ["Output does Z"],
     "non_goals": ["Does not do W"],
     "dependencies": ["some-other-skill"],
     "plugin_dependencies": ["superpowers:brainstorming"],
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
- `npm run validate -- <path>` — Validate a `skill.json` (required fields, semver, and that any `dependencies` slugs resolve to a real skill in the repo). Example: `npm run validate -- skills/docs-writing/skill.json`.
- `npm run install:cursor -- <destination> [source-path] [options]` — Install skills for Cursor.
  - `--scope=global|project` — Only install skills with matching scope
  - `--tags=tag1,tag2` — Only install skills with at least one matching tag (untagged skills always pass)
  - `--include-claude` — Also install CLAUDE.md reference files
  - Second positional arg to target a specific skill or group (e.g., `skills/general-coding-rules`)
- `npm run install:claude -- <destination> [source-path] [options]` — Install skills for Claude Code. Same options as above.
- `npm run ci` — Validate and generate (for CI or pre-commit).
