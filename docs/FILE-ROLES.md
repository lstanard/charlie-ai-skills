# Skill file roles

This repo uses a **skill.json → generated files** workflow. Each skill lives in `skills/<skill-name>/` with the following roles.

## skill.json (source of truth)

**Do not edit generated files by hand** when you have a `skill.json`. Edit `skill.json` and run `npm run gen` to regenerate.

- **id**: Unique identifier (e.g. `charlie.docs-writing`).
- **title**, **version**, **description**: Shown in SKILL.md and cursor rules.
- **triggers**: When to apply this skill (e.g. “write README”, “generate documentation”).
- **inputs**: Parameters the skill accepts (for docs only; not enforced at runtime).
- **guarantees**: What the AI must ensure in its output.
- **non_goals**: What the skill explicitly does not do.
- **notes**: Extra guidance (preferences, audience, formatting).

Validation: `npm run validate -- path/to/skill.json`.

## SKILL.md (generated)

Step-by-step and contract for the AI when this skill is invoked. Generated from `skill.json`: purpose, triggers, inputs, guarantees, non-goals, notes. Used by Cursor, Claude Code, and Codex as the skill definition. Regenerate with `npm run gen`.

## cursor.rule.md (generated)

Cursor-specific rule for this skill. Tells Cursor when to apply the skill (from **triggers**) and how to behave (from **guarantees**, **notes**, **non_goals**). Regenerate with `npm run gen`.

## CLAUDE.md (optional)

**CLAUDE.md** can be shared across multiple related skills in a group. It holds **reference knowledge** that skills refer to:

- Patterns, templates, decision trees
- Constants (IDs, URLs, env vars)
- Edge cases and pitfalls
- Domain rules that don't fit in step-by-step instructions

**SKILL.md** = "do these steps when this skill is invoked."
**CLAUDE.md** = "here is the background knowledge to use while doing them."

In this repo, **CLAUDE.md** is used at the group level:
- `skills/frontend-architecture/CLAUDE.md` – Shared by react-layering, react-view-extraction, react-domain-models, etc.
- `skills/testing/CLAUDE.md` – Shared by react-component-testing, mock-data-strategy, graphql-testing, etc.

You only need **CLAUDE.md** if you add a skill (or group of skills) that benefits from a separate reference doc. For many individual skills, **SKILL.md** plus **notes** in `skill.json` is enough.

Summary:

| File           | Role |
|----------------|------|
| `skill.json`   | Source of truth; edit this, then run `npm run gen`. |
| `SKILL.md`     | Generated skill definition (purpose, triggers, guarantees, etc.). |
| `cursor.rule.md` | Generated Cursor rule for this skill. |
| `CLAUDE.md`    | Optional; extra reference knowledge when one skill needs a dedicated knowledge file. |

## Codex installation

`npm run install:codex` copies skills to `.agents/skills/`. The installed `SKILL.md` keeps the generated metadata and instructions and gains a Codex compatibility section with links to its reference documents. No extra Codex manifest or `agents/openai.yaml` is required.

Skill-local `CLAUDE.md` and other resources stay beside `SKILL.md`. Shared group knowledge is copied to `references/group/CLAUDE.md` within each installed skill, with the group's `examples/` directory beside it when present. These are reference files, read explicitly when directed by the installed skill. They are not global instructions.

Always-on Codex instructions belong in `AGENTS.md`. Installation does not create or modify that file or convert Claude settings and hooks.
