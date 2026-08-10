---
name: pr-size-guard
description: Flags changes likely to become an oversized, hard-to-review PR, and proposes concrete ways to split them before they grow further. Applies in three situations — proactively while writing or reviewing an implementation plan for a multi-file feature, to flag any phase likely to exceed the size thresholds once written; proactively after finishing a task or phase within an active multi-step implementation, before starting the next one, to check the diff accumulated so far; and on explicit request — 'check PR size', 'is this too big', 'should I split this', 'check this PR' — for in-flight work or an already-open PR. Measures added lines and changed files (excluding lockfiles, snapshots, generated/build output, and minified files) against fixed thresholds, and is advisory only, reporting findings and proposing a split — it never blocks.
---

# PR Size Guard
version: 0.1.0

## Purpose
Flags changes likely to become an oversized, hard-to-review PR, and proposes concrete ways to split them before they grow further. Applies in three situations — proactively while writing or reviewing an implementation plan for a multi-file feature, to flag any phase likely to exceed the size thresholds once written; proactively after finishing a task or phase within an active multi-step implementation, before starting the next one, to check the diff accumulated so far; and on explicit request — 'check PR size', 'is this too big', 'should I split this', 'check this PR' — for in-flight work or an already-open PR. Measures added lines and changed files (excluding lockfiles, snapshots, generated/build output, and minified files) against fixed thresholds, and is advisory only, reporting findings and proposing a split — it never blocks.

## Triggers
- check pr size
- is this pr too big
- should i split this pr
- check this pr
- review pr size
- check pr #<number>
- writing an implementation plan
- finished a task in the plan
- before starting the next task
- before opening a pr

## Inputs
- target: string (optional) — a PR number or URL to check on demand; defaults to the current working branch's diff against the repo's default branch

## Guarantees
- Resolves the default branch via `git symbolic-ref refs/remotes/origin/HEAD`, falling back to `main` then `master`, and diffs `merge-base(default, HEAD)` with `git diff --numstat --no-renames` against the current working tree (covering committed, staged, unstaged, and untracked changes) to measure the local working diff.
- Excludes lockfiles (package-lock.json, yarn.lock, pnpm-lock.yaml, Gemfile.lock, poetry.lock, Cargo.lock, go.sum), snapshot files (*.snap, __snapshots__/), generated/build output (dist/, build/, .next/, generated/), and minified files (*.min.js, *.min.css) from both the added-lines count and the changed-files count.
- Flags when added lines exceed 1000, OR non-excluded changed files exceed 25 — either condition alone is enough to trigger a flag.
- For an already-open PR, measures via `gh pr view <number> --json files --jq '.files[] | [.additions, .deletions, .path] | @tsv'` (falling back to `gh api --paginate repos/{owner}/{repo}/pulls/<number>/files` for PRs large enough to hit the ~100-file cap on `--json files`), or the GitHub MCP `pull_request_read` tool if `gh` is unavailable, applying the same thresholds and exclusions as the local diff.
- At plan-writing time, before any diff exists, assesses each phase/task in the plan for likely scope (number of distinct files/directories it is expected to touch, number of architectural layers it spans) and flags any phase that looks likely to exceed the thresholds once written.
- During an active multi-step implementation, checks the accumulated diff after finishing a task or phase, before starting the next one.
- When flagging, proposes a split using whichever named pattern fits the diff's shape: layered split (schema/migration to backend to frontend to tests), feature-seam split (by independent sub-feature or module), prep-PR-first (extract mechanical prep ahead of the behavioral change), or stacked PRs (sequentially dependent, merged base-first) — see CLAUDE.md for the selection guidance.
- Reports findings in a fixed format: the measured or estimated lines/files, which threshold(s) were exceeded, and a proposed split with an estimated size per piece.
- Advisory only — never blocks, gates, or requires acknowledgment before the user can proceed.

## Non-goals
- Does not create branches, commits, or PRs itself — splitting execution is left to the user or to sdlc-jira-github:create-pr / create-story-branch.
- Does not run in non-git directories.
- Does not modify or depend on editing other skills or plugins (writing-plans, sdlc-jira-github) — it recognizes its own trigger moments independently.
- Does not gate merges or task completion on its findings.

## Notes
See CLAUDE.md for the exact git/gh commands, the exclusion pattern list, the plan-time assessment procedure, and split-strategy selection guidance with examples.