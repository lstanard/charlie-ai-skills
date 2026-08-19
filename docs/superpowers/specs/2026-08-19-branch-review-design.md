# Branch Review — Design Spec

Date: 2026-08-19

## Purpose

The user reviews other people's work by checking out their branch locally. Existing review skills either post directly to GitHub (`sdlc-jira-github:ai-review`) or operate on an arbitrary target — PR number, branch, or path (`code-review:code-review`). The user wants a custom, lightweight skill scoped to exactly one situation: review the branch that is currently checked out, print the findings locally, and stop. The user reads the findings and decides case by case whether to post any of them as a PR comment. The skill never posts anywhere and never edits code.

## Scope

New skill at `skills/branch-review/`:
- `skill.json` — source of truth
- `SKILL.md`, `cursor.rule.md` — generated via `npm run gen`
- `CLAUDE.md` — needed: the diff-resolution commands, the exclusion list, and the per-category review guidance are too long to keep in `skill.json`/`SKILL.md`.

Added to the general skills table in `README.md` per the `skill-maintenance` skill's convention.

## Trigger

`scope: global`, no tags — this is a personal workflow preference, not project-specific.

Triggers on:
- "review this branch"
- "review my branch"
- "review this PR" (only when no PR number or URL is given — see Non-goals)
- "do a quick review of this branch"
- "branch review"

## Inputs

None. The skill always operates on the currently checked-out branch. No PR number, URL, or path target is accepted — that is what separates this skill from the existing `code-review:code-review` skill.

## Behavior

### 1. Resolve the diff

Same resolution procedure as `pr-size-guard` (see `skills/pr-size-guard/CLAUDE.md` for the exact commands), reused here rather than re-derived:
- Resolve the default branch via `git symbolic-ref refs/remotes/origin/HEAD`, falling back to `main` then `master`.
- Diff `merge-base(default, HEAD)` against the current working tree with `git diff --no-renames`, covering committed, staged, and unstaged changes.
- Separately collect untracked files via `git status --porcelain --untracked-files=all`.
- Exclude the same categories `pr-size-guard` excludes: lockfiles, snapshot files, generated/build output, minified files. A reviewer has nothing useful to say about a regenerated lockfile.
- If the resulting diff is empty, say so and stop — there is nothing to review.

### 2. Read full file context

For each changed file (not excluded above), read the complete current file content, not just the diff hunks. Logic errors and missing edge-case handling are often invisible from a hunk alone — e.g., a changed function's correctness can depend on a helper defined elsewhere in the same file.

### 3. Review across four categories

- **Correctness** — logic errors, edge cases, incorrect assumptions, missing or wrong error handling.
- **Security** — injection, auth/authz gaps, hardcoded secrets, unsafe handling of user input.
- **Maintainability** — duplication, unnecessary complexity, unclear naming, dead code.
- **Test coverage** — new logic or edge cases with no corresponding test, or tests that run code without asserting the behavior that matters.

This is a single pass over the diff. No subagent fan-out, no adversarial re-verification pass — that is what "lightweight" means here, and what separates this from the more thorough `code-review:code-review` skill.

### 4. Rank and report

Each finding gets one of three severities:
- **Critical** — a bug or security issue that should block merge.
- **Important** — a real problem, not necessarily blocking.
- **Minor** — a style nit or suggestion.

Report using the index-first format already established by the user's global CLAUDE.md conventions: one line per finding (severity + `file:line` + short title), most severe first, no cap on how many are listed. Wait for the user to pick one before expanding it (what it is, why it matters, a suggested fix described in words — not applied). If there are zero findings, say so directly instead of printing an empty index.

## Non-goals

- Does not accept a PR number, URL, or file path as a target — the currently checked-out branch is the only target. Reviewing an arbitrary PR is what `code-review:code-review` is for.
- Does not post PR comments, submit a GitHub review, or call any `gh pr` / GitHub API mutation. Output goes to the chat only.
- Does not edit, fix, or refactor any code — findings only.
- Does not run linters, type checkers, or the test suite itself.
- Does not fan out to subagents or run multiple verification passes.

## Relationship to existing skills

- Reuses `pr-size-guard`'s diff-resolution and exclusion-list approach for consistency, without taking a dependency on it — `branch-review` implements its own copy of the commands, matching `pr-size-guard`'s own non-goal of not depending on other skills.
- Distinct from `code-review:code-review` (accepts a PR/branch/path target, supports posting inline comments and applying fixes) and `security-review` (security-only, works from the current diff on the branch). `branch-review` is the narrow, local-only, no-fix, current-branch-only case.
