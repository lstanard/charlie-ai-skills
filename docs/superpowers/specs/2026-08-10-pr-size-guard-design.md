# PR Size Guard — Design Spec

Date: 2026-08-10

## Purpose

AI-assisted coding makes it easy to generate large amounts of code quickly. That has produced larger PRs than before, which are harder to review and more likely to hide mistakes. Waiting until a PR is posted to notice it's too big is too late: by then, splitting it means unwinding already-written work. This skill flags oversized changes early — while a plan is being written, while code is being written, and on demand for an already-open PR — and proposes concrete ways to split them.

## Scope

New skill at `skills/pr-size-guard/`:
- `skill.json` — source of truth
- `SKILL.md`, `cursor.rule.md` — generated via `npm run gen`
- `CLAUDE.md` — measurement mechanics, exclusion list, and split-strategy reference (same pattern as `frontend-performance-audit` and `quiz-me`, since this combines a static rule with a multi-step measurement procedure)

Added to the general skills table in `README.md` per the `skill-maintenance` skill's convention.

`scope: global`, no tags. Applies to any git-based codebase, not tied to a stack.

## Trigger moments

One skill, three moments it can fire in:

1. **Plan-time** — while writing or reviewing an implementation plan for a multi-file feature. No diff exists yet, so this is judgment-based: assess each phase/task in the plan for likely scope (number of distinct files/directories it touches, number of architectural layers it spans) and flag any phase that looks like it would exceed the thresholds once written.
2. **Mid-coding checkpoint** — after finishing a task or phase within an active multi-step implementation, before starting the next one. Measures the actual diff accumulated so far on the working branch.
3. **Explicit request** — the user asks directly: "check PR size," "is this too big," "should I split this," "check PR #123." Covers both in-flight work and an already-open PR.

Trigger phrases in the skill description need to cover all three so the skill activates on its own for moments 1 and 2, not only when the user says a specific phrase.

## Measurement mechanics

**Local diff (plan-time is judgment-only; mid-coding and in-flight explicit checks use this):**
1. Resolve the default branch: `git symbolic-ref refs/remotes/origin/HEAD`, falling back to `main` then `master` if that fails.
2. Find the merge-base between the default branch and `HEAD`.
3. Run `git diff --numstat <merge-base>...HEAD` to get per-file added/deleted line counts.

**Existing PR (on-demand only):** use `gh pr diff <number> --stat`, or the GitHub MCP `pull_request_read` tool if `gh` is unavailable, instead of local git. Same thresholds and exclusions apply.

**Exclusions from both the line and file counts:**
- Lockfiles: `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `Gemfile.lock`, `poetry.lock`, `Cargo.lock`, `go.sum`
- Snapshot files: `*.snap`, `__snapshots__/`
- Generated/build output: `dist/`, `build/`, `.next/`, `generated/`
- Minified files: `*.min.js`, `*.min.css`

**Thresholds:** flag when added lines exceed 1000, OR non-excluded changed files exceed 25. Either condition alone triggers a flag.

## Split strategies

The skill recommends whichever named pattern fits the diff's actual shape, using touched file paths/directories as the signal:

1. **Layered split** — schema/migration → backend/API → frontend/UI → tests, each a sequentially-mergeable PR. Fits when the diff spans multiple architectural layers.
2. **Feature-seam split** — by independent sub-feature or module boundary. Fits when the diff bundles multiple unrelated capabilities.
3. **Prep-PR-first** — extract mechanical prep (renames, extractions, config/dependency bumps) into its own PR ahead of the behavioral change. Fits when a large share of the diff is non-behavioral churn.
4. **Stacked PRs** — when the change genuinely can't be decoupled (e.g. a feature built on a refactor it depends on), stack dependent PRs so each is still individually reviewable, merged base-first.

## Output format

Same shape across all three trigger moments: report the numbers, state which threshold(s) were exceeded, propose a concrete split with estimated size per piece.

```
PR size check: 1,430 lines added, 31 files changed (3 lockfiles/generated files excluded)
Over threshold: lines (>1000) and files (>25)

Suggested split — layered (diff spans migrations/, api/, web/):
1. Migration + schema (~150 lines, 4 files)
2. API endpoints + backend logic (~600 lines, 12 files)
3. Frontend integration (~500 lines, 10 files)
```

At plan-time, the same format applies to estimated per-phase scope rather than a measured diff.

## Non-goals

- Advisory only. Never blocks, gates, or requires acknowledgment before proceeding — the user decides whether to act on a flag.
- Does not create branches, commits, or PRs itself. Splitting execution is left to the user or to `sdlc-jira-github:create-pr` / `create-story-branch`.
- Does not run in non-git directories.
- Does not modify or depend on editing other skills or plugins (`writing-plans`, `sdlc-jira-github`) — it recognizes its own trigger moments independently.
