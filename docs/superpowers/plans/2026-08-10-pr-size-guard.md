# PR Size Guard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new skill, `pr-size-guard`, that flags changes likely to become an oversized PR (plan-time, mid-coding, or on-demand) and proposes a concrete split.

**Architecture:** This is a declarative content skill (`skill.json` → generated `SKILL.md`/`cursor.rule.md`, plus a `CLAUDE.md` reference doc), not application code — there is no unit-test framework for it. The verification cycle for each task is write → validate/generate → inspect the actual output → commit, using this repo's own tooling (`npm run validate`, `npm run gen`) as the check, in place of a test runner.

**Tech Stack:** Node scripts already in the repo (`scripts/validateSkill.js`, `scripts/generateSkillFiles.js`); no new dependencies.

## Global Constraints

- `scope: "global"`, no `tags` — this applies to any git-based codebase, not a specific stack (per design spec).
- Advisory only. The skill must never block, gate, or require acknowledgment before proceeding.
- Threshold: flag when added lines exceed 1000, OR non-excluded changed files exceed 25. Either condition alone triggers a flag.
- Exclude from both counts: lockfiles (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `Gemfile.lock`, `poetry.lock`, `Cargo.lock`, `go.sum`), snapshot files (`*.snap`, `__snapshots__/`), generated/build output (`dist/`, `build/`, `.next/`, `generated/`), minified files (`*.min.js`, `*.min.css`).
- Never hand-edit `SKILL.md` or `cursor.rule.md` — only `skill.json`, then regenerate (per `skill-maintenance` skill).
- README.md skills table gets a new row per the `skill-maintenance` skill's format: `| [skill-name](skills/path/) | One-line description matching the skill.json description field. |`

---

### Task 1: Create `skill.json` and generate `SKILL.md` / `cursor.rule.md`

**Files:**
- Create: `skills/pr-size-guard/skill.json`
- Create (generated): `skills/pr-size-guard/SKILL.md`
- Create (generated): `skills/pr-size-guard/cursor.rule.md`

**Interfaces:**
- Consumes: none (first task).
- Produces: `skills/pr-size-guard/skill.json` with fields `id`, `title`, `version`, `description`, `triggers`, `guarantees`, `non_goals`, `notes` — Task 2's `CLAUDE.md` must stay consistent with the thresholds/exclusions/strategies named in this file's `guarantees`, and the README row added in Task 3 must copy this file's `description` field verbatim (per the `skill-maintenance` convention).

- [ ] **Step 1: Write `skills/pr-size-guard/skill.json`**

```json
{
  "scope": "global",
  "id": "charlie.pr-size-guard",
  "title": "PR Size Guard",
  "version": "0.1.0",
  "description": "Flags changes likely to become an oversized, hard-to-review PR, and proposes concrete ways to split them before they grow further. Applies in three situations: proactively while writing or reviewing an implementation plan for a multi-file feature, to flag any phase likely to exceed the size thresholds once written; proactively after finishing a task or phase within an active multi-step implementation, before starting the next one, to check the diff accumulated so far; and on explicit request — 'check PR size', 'is this too big', 'should I split this', 'check this PR' — for in-flight work or an already-open PR. Measures added lines and changed files (excluding lockfiles, snapshots, generated/build output, and minified files) against fixed thresholds, and is advisory only: it reports findings and proposes a split, it never blocks.",
  "triggers": [
    "check pr size",
    "is this pr too big",
    "should i split this pr",
    "check this pr",
    "review pr size",
    "check pr #<number>",
    "writing an implementation plan",
    "finished a task in the plan",
    "before starting the next task",
    "before opening a pr"
  ],
  "inputs": {
    "target": "string (optional) — a PR number or URL to check on demand; defaults to the current working branch's diff against the repo's default branch"
  },
  "guarantees": [
    "Resolves the default branch via `git symbolic-ref refs/remotes/origin/HEAD`, falling back to `main` then `master`, and diffs `merge-base(default, HEAD)...HEAD` with `git diff --numstat` to measure the local working diff.",
    "Excludes lockfiles (package-lock.json, yarn.lock, pnpm-lock.yaml, Gemfile.lock, poetry.lock, Cargo.lock, go.sum), snapshot files (*.snap, __snapshots__/), generated/build output (dist/, build/, .next/, generated/), and minified files (*.min.js, *.min.css) from both the added-lines count and the changed-files count.",
    "Flags when added lines exceed 1000, OR non-excluded changed files exceed 25 — either condition alone is enough to trigger a flag.",
    "For an already-open PR, measures via `gh pr diff <number> --stat`, or the GitHub MCP `pull_request_read` tool if `gh` is unavailable, applying the same thresholds and exclusions as the local diff.",
    "At plan-writing time, before any diff exists, assesses each phase/task in the plan for likely scope (number of distinct files/directories it is expected to touch, number of architectural layers it spans) and flags any phase that looks likely to exceed the thresholds once written.",
    "During an active multi-step implementation, checks the accumulated diff after finishing a task or phase, before starting the next one.",
    "When flagging, proposes a split using whichever named pattern fits the diff's shape: layered split (schema/migration to backend to frontend to tests), feature-seam split (by independent sub-feature or module), prep-PR-first (extract mechanical prep ahead of the behavioral change), or stacked PRs (sequentially dependent, merged base-first) — see CLAUDE.md for the selection guidance.",
    "Reports findings in a fixed format: the measured or estimated lines/files, which threshold(s) were exceeded, and a proposed split with an estimated size per piece.",
    "Advisory only — never blocks, gates, or requires acknowledgment before the user can proceed."
  ],
  "non_goals": [
    "Does not create branches, commits, or PRs itself — splitting execution is left to the user or to sdlc-jira-github:create-pr / create-story-branch.",
    "Does not run in non-git directories.",
    "Does not modify or depend on editing other skills or plugins (writing-plans, sdlc-jira-github) — it recognizes its own trigger moments independently.",
    "Does not gate merges or task completion on its findings."
  ],
  "notes": "See CLAUDE.md for the exact git/gh commands, the exclusion pattern list, the plan-time assessment procedure, and split-strategy selection guidance with examples."
}
```

- [ ] **Step 2: Validate the skill.json**

Run: `npm run validate -- skills/pr-size-guard/skill.json`
Expected output: `OK charlie.pr-size-guard` (exit code 0). If it instead reports missing fields or a bad version string, fix `skill.json` and re-run.

- [ ] **Step 3: Generate SKILL.md and cursor.rule.md**

Run: `npm run gen`
Expected output includes the line: `  skills/pr-size-guard: SKILL.md, cursor.rule.md`

- [ ] **Step 4: Verify the generated files**

Run: `cat skills/pr-size-guard/SKILL.md`

Expected: frontmatter with `name: pr-size-guard` and `description:` matching the `skill.json` description verbatim, followed by a `# PR Size Guard` heading, `version: 0.1.0`, and `## Purpose` / `## Triggers` / `## Inputs` / `## Guarantees` / `## Non-goals` / `## Notes` sections populated from the fields written in Step 1. Confirm no section is empty and nothing was hand-edited (this file is fully generated — if it looks wrong, fix `skill.json` and re-run Step 3, never edit `SKILL.md` directly).

- [ ] **Step 5: Commit**

```bash
git add skills/pr-size-guard/skill.json skills/pr-size-guard/SKILL.md skills/pr-size-guard/cursor.rule.md
git commit -m "Add pr-size-guard skill.json and generated files"
```

---

### Task 2: Write `CLAUDE.md` reference doc

**Files:**
- Create: `skills/pr-size-guard/CLAUDE.md`

**Interfaces:**
- Consumes: the exact threshold values, exclusion patterns, and split-strategy names from Task 1's `skill.json` `guarantees` — this doc must not introduce different numbers or a fifth strategy not named there.
- Produces: the execution procedure that `SKILL.md`'s `notes` field points readers to; no other task depends on this file's internals, but its report-format template must match what a user invoking the skill will actually see.

- [ ] **Step 1: Write `skills/pr-size-guard/CLAUDE.md`**

```markdown
# PR Size Guard — Reference

## When to invoke

Three situations trigger this skill:
- **Plan-time** — while writing or reviewing an implementation plan for a multi-file feature.
- **Mid-coding checkpoint** — after finishing a task or phase within an active multi-step implementation, before starting the next one.
- **Explicit request** — "check PR size," "is this too big," "should I split this," "check PR #123" (or a URL) — covers both in-flight work and an already-open PR.

---

## Thresholds

| Metric | Threshold | Note |
|---|---|---|
| Added lines | > 1000 | Counts only non-excluded files |
| Changed files | > 25 | Counts only non-excluded files |

Either threshold alone is enough to flag. Both use the same exclusion list.

## Exclusions

Excluded from both the added-lines and changed-files counts:

| Category | Patterns |
|---|---|
| Lockfiles | `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `Gemfile.lock`, `poetry.lock`, `Cargo.lock`, `go.sum` |
| Snapshots | `*.snap`, `__snapshots__/` |
| Generated/build output | `dist/`, `build/`, `.next/`, `generated/` |
| Minified files | `*.min.js`, `*.min.css` |

---

## Execution steps

### 1. Determine which moment applies

- If there's no diff yet (a plan is being written or reviewed), use the **plan-time procedure** (Step 4).
- If work is in progress on a branch with local commits, use the **local diff procedure** (Step 2).
- If the user names an existing PR (a number or URL), use the **existing-PR procedure** (Step 3).

### 2. Local diff procedure (mid-coding checkpoint, or explicit check of in-flight work)

Resolve the default branch:

```bash
DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@')
DEFAULT_BRANCH=${DEFAULT_BRANCH:-main}
git show-ref --verify --quiet "refs/remotes/origin/$DEFAULT_BRANCH" || DEFAULT_BRANCH=master
```

Find the merge-base and diff against it:

```bash
MERGE_BASE=$(git merge-base "origin/$DEFAULT_BRANCH" HEAD)
git diff --numstat "$MERGE_BASE"...HEAD
```

Sum added lines and count files, excluding the patterns above:

```bash
git diff --numstat "$MERGE_BASE"...HEAD | awk '
  $3 ~ /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|Gemfile\.lock|poetry\.lock|Cargo\.lock|go\.sum)$/ { next }
  $3 ~ /\.snap$/ || $3 ~ /(^|\/)__snapshots__\// { next }
  $3 ~ /(^|\/)(dist|build|\.next|generated)\// { next }
  $3 ~ /\.min\.(js|css)$/ { next }
  { added += $1; files += 1 }
  END { printf "%d lines added, %d files changed\n", added, files }
'
```

### 3. Existing-PR procedure (on demand)

Prefer the GitHub CLI:

```bash
gh pr diff <number> --stat
```

If `gh` is unavailable, use the GitHub MCP `pull_request_read` tool to fetch the file list and per-file added/deleted counts instead. Apply the same exclusion patterns and thresholds as Step 2 — filter the returned file list against the exclusion patterns before summing.

### 4. Plan-time procedure (no diff exists)

For each phase or task in the plan being written or reviewed, estimate:
- The number of distinct files or directories it's expected to touch.
- The number of architectural layers it spans (e.g., migration/schema, backend/API, frontend/UI, tests each count as one layer).

Flag a phase if it looks likely to exceed the thresholds once written — as a rule of thumb, a phase expected to touch more than ~25 files, or to span 3+ layers in one phase, is a candidate. This is a judgment call, not a measurement — state it as an estimate, not a fact.

### 5. Compare against thresholds

Using the counts from Step 2, 3, or the estimate from Step 4: flag if added lines > 1000, or changed files > 25.

### 6. Choose a split strategy

| Strategy | Structure | Fits when |
|---|---|---|
| Layered split | Schema/migration → backend/API → frontend/UI → tests, each its own sequentially-mergeable PR | The diff spans multiple architectural layers |
| Feature-seam split | One PR per independent sub-feature or module boundary | The diff bundles multiple unrelated capabilities |
| Prep-PR-first | Extract mechanical prep (renames, extractions, config/dependency bumps) into its own PR ahead of the behavioral change | A large share of the diff is non-behavioral churn |
| Stacked PRs | Sequentially dependent PRs, each individually reviewable, merged base-first | The change genuinely can't be decoupled (e.g. a feature built on a refactor it depends on) |

Pick the strategy using the touched file paths/directories as signal — e.g., if the diff touches `migrations/`, `api/`, and `web/`, that's a layered split; if most of the diff is file moves/renames, that's prep-PR-first.

### 7. Report findings

Use this format for all three moments (substitute "estimated" language for the plan-time case, since no diff exists yet):

```
PR size check: 1,430 lines added, 31 files changed (3 lockfiles/generated files excluded)
Over threshold: lines (>1000) and files (>25)

Suggested split — layered (diff spans migrations/, api/, web/):
1. Migration + schema (~150 lines, 4 files)
2. API endpoints + backend logic (~600 lines, 12 files)
3. Frontend integration (~500 lines, 10 files)
```

If neither threshold is exceeded, do not produce this report — say nothing, or confirm briefly if the user asked explicitly.

---

## Non-goals

- Never blocks, gates, or requires acknowledgment before the user can proceed — advisory only.
- Does not create branches, commits, or PRs — that's `sdlc-jira-github:create-pr` / `create-story-branch`.
- Does not run in a non-git directory.
```

- [ ] **Step 2: Verify against skill.json**

Confirm the threshold values (1000 lines, 25 files), the four exclusion categories, and the four split-strategy names in `CLAUDE.md` match `skills/pr-size-guard/skill.json`'s `guarantees` field exactly — no drift between the two files.

- [ ] **Step 3: Commit**

```bash
git add skills/pr-size-guard/CLAUDE.md
git commit -m "Add pr-size-guard CLAUDE.md reference doc"
```

---

### Task 3: Update `README.md`

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: `skills/pr-size-guard/skill.json`'s `description` field (must be copied verbatim, per the `skill-maintenance` skill's convention).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Add the row to the general skills table**

In `README.md`, the general skills table currently ends with the `quiz-me` row (around line 16):

```
| [quiz-me](skills/quiz-me/)                                                   | Run an interactive comprehension quiz on code just produced or discussed, scored across mechanics, design rationale, operations, and big picture. |
```

Add a new row directly after it:

```
| [pr-size-guard](skills/pr-size-guard/)                                       | Flag changes likely to become an oversized PR (plan-time, mid-coding, or on demand) and propose a concrete split before they grow further. |
```

- [ ] **Step 2: Verify**

Run: `grep -n "pr-size-guard" README.md`
Expected: one match, the row just added, with a working relative link `skills/pr-size-guard/`.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "Add pr-size-guard to skills README table"
```

---

### Task 4: Full repo verification

**Files:**
- None (verification only).

**Interfaces:**
- Consumes: all files created/modified in Tasks 1–3.
- Produces: nothing — this is the final check before the plan is considered done.

- [ ] **Step 1: Run full validate + gen across all skills**

Run: `npm run ci`
Expected: every skill (including `pr-size-guard`) reports `OK <id>` from validation, generation reports a file pair for every skill directory including `skills/pr-size-guard`, and the command exits 0.

- [ ] **Step 2: Confirm no unintended diff from regeneration**

Run: `git status`
Expected: clean working tree (no changes) — regeneration in Step 1 must be a no-op since nothing changed since Task 1's commit. If `git diff` shows changes to any other skill's `SKILL.md`/`cursor.rule.md`, investigate before proceeding — it means the generator behavior changed, not just this new skill's content.

- [ ] **Step 3: Report completion**

Summarize to the user: the new skill's location, the three trigger moments, and that `npm run ci` passes clean. Do not claim "done" without having actually run and observed the Step 1 and Step 2 output in this session (per `superpowers:verification-before-completion`).
