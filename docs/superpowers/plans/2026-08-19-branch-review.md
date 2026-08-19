# Branch Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new skill, `branch-review`, that reviews the currently checked-out branch's diff against the default branch and prints findings locally, without posting anywhere or fixing anything.

**Architecture:** This is a declarative content skill (`skill.json` → generated `SKILL.md`/`cursor.rule.md`, plus a `CLAUDE.md` reference doc), not application code — there is no unit-test framework for it. The verification cycle for each task is write → validate/generate → inspect the actual output → commit, using this repo's own tooling (`npm run validate`, `npm run gen`) as the check, in place of a test runner.

**Tech Stack:** Node scripts already in the repo (`scripts/validateSkill.js`, `scripts/generateSkillFiles.js`); no new dependencies.

**Spec:** `docs/superpowers/specs/2026-08-19-branch-review-design.md`

## Global Constraints

- `scope: "global"`, no `tags` — personal workflow preference, applies to any git-based codebase (per design spec).
- No inputs — always operates on the currently checked-out branch. No PR number, URL, or path target.
- Diff scope: `merge-base(default, HEAD)` against the working tree, covering committed, staged, unstaged, and untracked changes — same resolution approach as `pr-size-guard`.
- Exclude from review: lockfiles (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `Gemfile.lock`, `poetry.lock`, `Cargo.lock`, `go.sum`), snapshot files (`*.snap`, `__snapshots__/`), generated/build output (`dist/`, `build/`, `.next/`, `generated/`), minified files (`*.min.js`, `*.min.css`).
- Four review categories: correctness, security, maintainability, test coverage. Single pass — no subagent fan-out, no adversarial re-verification.
- Three severities: Critical, Important, Minor.
- Report format: index-first (one line per finding, most severe first, no cap), wait for the user to pick one before expanding it. If there is no diff or zero findings, say so directly instead of printing an empty index.
- Never posts a PR comment or review, never calls a `gh pr` mutation, never edits/fixes code, never runs lint/tests/subagents.
- Never hand-edit `SKILL.md` or `cursor.rule.md` — only `skill.json`, then regenerate (per `skill-maintenance` skill).
- README.md skills table gets a new row per the `skill-maintenance` skill's format: `| [skill-name](skills/path/) | One-line description matching the skill.json description field. |`

---

### Task 1: Create `skill.json` and generate `SKILL.md` / `cursor.rule.md`

**Files:**
- Create: `skills/branch-review/skill.json`
- Create (generated): `skills/branch-review/SKILL.md`
- Create (generated): `skills/branch-review/cursor.rule.md`

**Interfaces:**
- Consumes: none (first task).
- Produces: `skills/branch-review/skill.json` with fields `id`, `title`, `version`, `description`, `triggers`, `guarantees`, `non_goals`, `notes` — Task 2's `CLAUDE.md` must stay consistent with the categories/severities/report format named in this file's `guarantees`, and the README row added in Task 3 must copy this file's `description` field verbatim (per the `skill-maintenance` convention).

- [ ] **Step 1: Write `skills/branch-review/skill.json`**

```json
{
  "scope": "global",
  "id": "charlie.branch-review",
  "title": "Branch Review",
  "version": "0.1.0",
  "description": "Reviews the currently checked-out branch's diff against the repo's default branch and reports findings locally — never posts a comment or review to GitHub or anywhere else, and never edits or fixes code. Built for reviewing someone else's work after checking out their branch: reads the full content of each changed file (not just diff hunks) across four categories — correctness, security, maintainability, test coverage — and reports findings ranked by severity (Critical, Important, Minor) so the user can decide case by case whether to post any of them as a PR comment. Single-pass and lightweight: no subagent fan-out, no PR-number/URL target, no automated posting.",
  "triggers": [
    "review this branch",
    "review my branch",
    "review this pr",
    "do a quick review of this branch",
    "branch review"
  ],
  "guarantees": [
    "Resolves the default branch via `git symbolic-ref refs/remotes/origin/HEAD`, falling back to `main` then `master`, and diffs `merge-base(default, HEAD)` against the current working tree with `git diff --no-renames`, covering committed, staged, unstaged, and untracked changes on the current branch — same resolution approach as `pr-size-guard`.",
    "Excludes lockfiles (package-lock.json, yarn.lock, pnpm-lock.yaml, Gemfile.lock, poetry.lock, Cargo.lock, go.sum), snapshot files (*.snap, __snapshots__/), generated/build output (dist/, build/, .next/, generated/), and minified files (*.min.js, *.min.css) from review.",
    "If the resulting diff is empty, says so and stops — no findings are fabricated.",
    "For each non-excluded changed file, reads the complete current file content, not just the diff hunks, before evaluating it.",
    "Reviews across four fixed categories: correctness (logic errors, edge cases, missing/incorrect error handling), security (injection, auth/authz gaps, secrets, unsafe input handling), maintainability (duplication, unnecessary complexity, naming, dead code), and test coverage (missing tests for new logic/edge cases, tests that don't assert the behavior that matters).",
    "Single pass over the diff — no subagent fan-out, no multi-pass adversarial verification.",
    "Assigns each finding one of three severities — Critical (bug/security issue that should block merge), Important (real problem, not necessarily blocking), Minor (style nit or suggestion) — and reports them index-first: one line per finding (severity + file:line + short title), most severe first, no cap, expanding only the finding the user picks.",
    "If there are zero findings, says so directly instead of printing an empty index.",
    "Output goes to the chat only — never posts a PR comment, submits a GitHub review, or calls any `gh pr` / GitHub API mutation, and never edits, fixes, or refactors any code."
  ],
  "non_goals": [
    "Does not accept a PR number, URL, or file path as a target — the currently checked-out branch is the only target.",
    "Does not post PR comments, submit a GitHub review, or call any `gh pr` / GitHub API mutation.",
    "Does not edit, fix, or refactor any code — findings only.",
    "Does not run linters, type checkers, or the test suite itself.",
    "Does not fan out to subagents or run multiple verification passes."
  ],
  "notes": "See CLAUDE.md for the exact git commands, the exclusion pattern list, the per-category review checklist, and the report format template."
}
```

- [ ] **Step 2: Validate the skill.json**

Run: `npm run validate -- skills/branch-review/skill.json`
Expected output: `OK charlie.branch-review` (exit code 0). If it instead reports missing fields or a bad version string, fix `skill.json` and re-run.

- [ ] **Step 3: Generate SKILL.md and cursor.rule.md**

Run: `npm run gen`
Expected output includes the line: `  skills/branch-review: SKILL.md, cursor.rule.md`

- [ ] **Step 4: Verify the generated files**

Run: `cat skills/branch-review/SKILL.md`

Expected: frontmatter with `name: branch-review` and `description:` matching the `skill.json` description verbatim, followed by a `# Branch Review` heading, `version: 0.1.0`, and `## Purpose` / `## Triggers` / `## Inputs` / `## Guarantees` / `## Non-goals` / `## Notes` sections populated from the fields written in Step 1 (`## Inputs` will be empty — this skill takes none). Confirm nothing was hand-edited (this file is fully generated — if it looks wrong, fix `skill.json` and re-run Step 3, never edit `SKILL.md` directly).

- [ ] **Step 5: Commit**

```bash
git add skills/branch-review/skill.json skills/branch-review/SKILL.md skills/branch-review/cursor.rule.md
git commit -m "Add branch-review skill.json and generated files"
```

---

### Task 2: Write `CLAUDE.md` reference doc

**Files:**
- Create: `skills/branch-review/CLAUDE.md`

**Interfaces:**
- Consumes: the exact category names, severities, and exclusion patterns from Task 1's `skill.json` `guarantees` — this doc must not introduce a fifth category, a fourth severity, or different exclusion patterns.
- Produces: the execution procedure that `SKILL.md`'s `notes` field points readers to; no other task depends on this file's internals, but its report-format template must match what a user invoking the skill will actually see.

- [ ] **Step 1: Write `skills/branch-review/CLAUDE.md`**

```markdown
# Branch Review — Reference

## When to invoke

The user has checked out someone else's branch locally and wants a fast, local-only review before deciding what (if anything) to post as a PR comment. Triggered by phrases like "review this branch," "review my branch," or "branch review" — never by a PR number or URL; that's out of scope for this skill.

---

## Step 1: Resolve the diff

Resolve the default branch:

```bash
DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@')
DEFAULT_BRANCH=${DEFAULT_BRANCH:-main}
git show-ref --verify --quiet "refs/remotes/origin/$DEFAULT_BRANCH" || DEFAULT_BRANCH=master
```

Find the merge-base:

```bash
MERGE_BASE=$(git merge-base "origin/$DEFAULT_BRANCH" HEAD)
```

List the changed tracked files, excluding the same categories `pr-size-guard` excludes:

```bash
git diff --numstat --no-renames "$MERGE_BASE" | awk '
  $3 ~ /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|Gemfile\.lock|poetry\.lock|Cargo\.lock|go\.sum)$/ { next }
  $3 ~ /\.snap$/ || $3 ~ /(^|\/)__snapshots__\// { next }
  $3 ~ /(^|\/)(dist|build|\.next|generated)\// { next }
  $3 ~ /\.min\.(js|css)$/ { next }
  { print $3 }
'
```

List the changed untracked files, same exclusions:

```bash
git status --porcelain --untracked-files=all | awk '$1 == "??" { print $2 }' | awk '
  /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|Gemfile\.lock|poetry\.lock|Cargo\.lock|go\.sum)$/ { next }
  /\.snap$/ || /(^|\/)__snapshots__\// { next }
  /(^|\/)(dist|build|\.next|generated)\// { next }
  /\.min\.(js|css)$/ { next }
  { print }
'
```

If both lists are empty: report "No diff between `$DEFAULT_BRANCH` and the current branch — nothing to review." and stop. Do not proceed to Step 2.

## Step 2: Read full file context

For each surviving tracked file, view its diff for orientation:

```bash
git diff --no-renames "$MERGE_BASE" -- <path>
```

Then read the complete current file content with the Read tool — not just the hunk. A changed function's correctness often depends on a helper defined elsewhere in the same file, which a hunk alone won't show.

For each surviving untracked file, read the complete file with the Read tool and treat the whole thing as newly added.

## Step 3: Review across four categories

For every file from Step 2, check each category. Do not skip a category because the diff "looks like" only one kind of change — a pure refactor can still introduce a correctness bug.

| Category | Look for |
|---|---|
| Correctness | Logic errors, off-by-one and boundary conditions, edge cases (empty/null/zero/duplicate input), missing or wrong error handling, incorrect assumptions about caller behavior or data shape |
| Security | Injection (SQL, shell, template), auth/authz gaps (missing permission check, broken access control), hardcoded secrets or credentials, unsafe handling of user-controlled input (path traversal, unescaped output) |
| Maintainability | Duplicated logic that already exists elsewhere in the file or repo, unnecessary complexity for what the change needs, unclear or misleading naming, dead code left behind |
| Test coverage | New logic or edge cases with no corresponding test, tests that execute code but don't assert the behavior that actually matters (e.g. only checking "it doesn't throw") |

Single pass: form a judgment on each file once. Do not re-review a file a second time looking for what you missed, and do not spawn subagents for this — that is what keeps this skill lightweight rather than duplicating `code-review:code-review`.

## Step 4: Assign severity

| Severity | Meaning |
|---|---|
| Critical | A bug or security issue that should block merge |
| Important | A real problem, worth raising, not necessarily blocking |
| Minor | A style nit or suggestion |

When a finding could plausibly sit between two severities, pick the higher one only if you can name the concrete failure scenario (bad input, race, missing check) that would trigger it; otherwise use the lower one.

## Step 5: Report findings

Follow index-first reporting: one line per finding, most severe first, no cap on count.

```
Branch review — 3 findings

1. [Critical] src/foo.ts:42 — off-by-one in pagination cursor
2. [Important] src/bar.ts:10 — SQL built via string concatenation
3. [Minor] src/baz.ts:88 — duplicated validation logic also in qux.ts

Pick a number to expand, or "all" for the full report.
```

On drill-in, expand only the chosen finding: what it is, why it matters, a concrete failure scenario, and a suggested fix described in words — never applied to the file.

If there are zero findings after reviewing every surviving file:

```
Branch review — 0 findings across 6 files reviewed against main.
```

---

## Non-goals

- Never posts a PR comment, submits a GitHub review, or calls any `gh pr` / GitHub API mutation — output goes to the chat only.
- Never edits, fixes, or refactors any code.
- Never runs linters, type checkers, or the test suite itself.
- Never accepts a PR number, URL, or file path as a target — the currently checked-out branch is the only target.
- Never fans out to subagents or runs multiple verification passes.
```

- [ ] **Step 2: Verify against skill.json**

Confirm the four category names, the three severity names, and the exclusion patterns in `CLAUDE.md` match `skills/branch-review/skill.json`'s `guarantees` field exactly — no drift between the two files.

- [ ] **Step 3: Commit**

```bash
git add skills/branch-review/CLAUDE.md
git commit -m "Add branch-review CLAUDE.md reference doc"
```

---

### Task 3: Update `README.md`

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: `skills/branch-review/skill.json`'s `description` field (must be copied verbatim, per the `skill-maintenance` skill's convention).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Add the row to the general skills table**

In `README.md`, the general skills table currently ends with the `explain-simply` row:

```
| [explain-simply](skills/explain-simply/)                                     | Reframe the most recent explanation in plain, concrete language when the user signals it didn't land (e.g. "I'm a stupid baby", "dumb it down", "ELI5"). |
```

Add a new row directly after it:

```
| [branch-review](skills/branch-review/)                                       | Review the currently checked-out branch against the default branch and report findings locally — never posts anywhere, never edits code. |
```

- [ ] **Step 2: Verify**

Run: `grep -n "branch-review" README.md`
Expected: one match, the row just added, with a working relative link `skills/branch-review/`.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "Add branch-review to skills README table"
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
Expected: every skill (including `branch-review`) reports `OK <id>` from validation, generation reports a file pair for every skill directory including `skills/branch-review`, and the command exits 0.

- [ ] **Step 2: Confirm no unintended diff from regeneration**

Run: `git status`
Expected: clean working tree (no changes) — regeneration in Step 1 must be a no-op since nothing changed since Task 1's commit. If `git diff` shows changes to any other skill's `SKILL.md`/`cursor.rule.md`, investigate before proceeding — it means the generator behavior changed, not just this new skill's content.

- [ ] **Step 3: Report completion**

Summarize to the user: the new skill's location, its trigger phrases, and that `npm run ci` passes clean. Do not claim "done" without having actually run and observed the Step 1 and Step 2 output in this session (per `superpowers:verification-before-completion`).
