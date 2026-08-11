# Explain Simply Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new global-scope skill, `explain-simply`, that reframes the most recent explanation in plain language whenever the user signals it didn't land (e.g. "I'm a stupid baby", "dumb it down", "ELI5").

**Architecture:** This repo generates `SKILL.md` and `cursor.rule.md` from a single `skill.json` source of truth via `npm run gen`. This skill needs no separate `CLAUDE.md` — all guarantees fit in `skill.json`. One task: write `skill.json`, validate it, generate the derived files, and register the skill in `README.md`.

**Tech Stack:** Node.js scripts (`scripts/validateSkill.js`, `scripts/generateSkillFiles.js`), no new dependencies.

## Global Constraints

- `scope: "global"` — this is a communication-style preference, applies across all projects, same as `general-coding-rules`.
- `id` must be `charlie.explain-simply` (repo convention: `charlie.<skill-name>`).
- `version` must be valid semver `x.y.z`; start at `0.1.0`.
- Never hand-edit `SKILL.md` or `cursor.rule.md` — only `skill.json`, then re-run `npm run gen`.
- README table entry format: `| [skill-name](skills/path/) | One-line description matching the skill.json description field. |`

---

### Task 1: Create the `explain-simply` skill

**Files:**
- Create: `skills/explain-simply/skill.json`
- Generate (via `npm run gen`, do not hand-edit): `skills/explain-simply/SKILL.md`, `skills/explain-simply/cursor.rule.md`
- Modify: `README.md` (add row to the general skills table)

**Interfaces:**
- Consumes: `scripts/validateSkill.js` (checks `id`, `title`, `version`, `description` present and `version` is semver), `scripts/generateSkillFiles.js` (reads `skill.json`, writes `SKILL.md` + `cursor.rule.md` into the same directory).
- Produces: nothing consumed by later tasks — this is the only task in the plan.

- [ ] **Step 1: Write `skill.json`**

Create `skills/explain-simply/skill.json`:

```json
{
  "scope": "global",
  "id": "charlie.explain-simply",
  "title": "Explain Simply",
  "version": "0.1.0",
  "description": "Reframe the most recent explanation in plain, concrete language when the user signals it didn't land. Trigger phrases include self-deprecating confusion cues ('I'm a stupid baby', 'I'm an idiot', 'I'm dumb', 'I'm stupid') and direct requests ('dumb it down', 'ELI5', 'explain like I'm five', 'explain simpler', 'I don't get it'). Strips jargon and invented or dense phrasing from the prior explanation and restates the same content in everyday words.",
  "triggers": [
    "I'm a stupid baby",
    "I'm an idiot",
    "I'm dumb",
    "I'm stupid",
    "dumb it down",
    "ELI5",
    "explain like I'm five",
    "explain simpler",
    "I don't get it"
  ],
  "guarantees": [
    "On trigger, re-explains only the most recent explanation, not the whole conversation, using plain, everyday words in place of jargon, dense compound phrases, or invented terminology.",
    "Preserves the actual content and technical accuracy of the original explanation; only the language changes, not the substance.",
    "Response stays matter-of-fact per the Agent Tone rules in CLAUDE.md — no baby talk, no exaggerated simplicity, no apologizing or reassurance filler ('no worries!', 'great question!').",
    "If a term is load-bearing (a specific API, flag, or concept name), keeps the term but defines it in plain words rather than dropping it."
  ],
  "non_goals": [
    "Does not shorten or omit content to make an explanation seem simpler — that's compression, not clarity.",
    "Does not proactively simplify explanations that weren't flagged as confusing.",
    "Does not change the level of technical depth for code identifiers, file paths, or exact commands."
  ],
  "notes": "Complements the global Agent Tone and Writing Style rules in CLAUDE.md, which already push toward plain language by default; this skill is the explicit fallback trigger for when a specific explanation still lands wrong."
}
```

- [ ] **Step 2: Validate the skill.json**

Run: `npm run validate -- skills/explain-simply/skill.json`
Expected: `OK charlie.explain-simply` printed, exit code 0. If it fails on missing fields or bad semver, fix `skill.json` and re-run.

- [ ] **Step 3: Generate SKILL.md and cursor.rule.md**

Run: `npm run gen`
Expected: output includes a line for `skills/explain-simply` listing `SKILL.md, cursor.rule.md`. This regenerates every skill in the repo, which is expected and safe — it's deterministic from each `skill.json`.

- [ ] **Step 4: Verify the generated SKILL.md**

Read `skills/explain-simply/SKILL.md` and confirm:
- YAML frontmatter has `name: explain-simply` and the `description` matches `skill.json`.
- `## Triggers`, `## Guarantees`, `## Non-goals`, `## Notes` sections are all present and match the source `skill.json` content.

No manual edits — if anything is wrong, fix `skill.json` and re-run Step 3.

- [ ] **Step 5: Add the skill to README.md**

In `README.md`, add a row to the general skills table (the first table, alongside `general-coding-rules`, `quiz-me`, etc.), keeping the existing column alignment style:

```markdown
| [explain-simply](skills/explain-simply/)                                    | Reframe the most recent explanation in plain, concrete language when the user signals it didn't land (e.g. "I'm a stupid baby", "dumb it down", "ELI5"). |
```

- [ ] **Step 6: Commit**

```bash
git add skills/explain-simply/skill.json skills/explain-simply/SKILL.md skills/explain-simply/cursor.rule.md README.md
git commit -m "Add explain-simply skill

Reframes the most recent explanation in plain language when the user
signals it didn't land, per docs/superpowers/specs/2026-08-11-explain-simply-design.md."
```
