---
name: branch-review
description: Reviews the currently checked-out branch's diff against the repo's default branch and reports findings locally — never posts a comment or review to GitHub or anywhere else, and never edits or fixes code. Built for reviewing someone else's work after checking out their branch: reads the full content of each changed file (not just diff hunks) across four categories — correctness, security, maintainability, test coverage — and reports findings ranked by severity (Critical, Important, Minor) so the user can decide case by case whether to post any of them as a PR comment. Single-pass and lightweight: no subagent fan-out, no PR-number/URL target, no automated posting.
---

# Branch Review
version: 0.1.0

## Purpose
Reviews the currently checked-out branch's diff against the repo's default branch and reports findings locally — never posts a comment or review to GitHub or anywhere else, and never edits or fixes code. Built for reviewing someone else's work after checking out their branch: reads the full content of each changed file (not just diff hunks) across four categories — correctness, security, maintainability, test coverage — and reports findings ranked by severity (Critical, Important, Minor) so the user can decide case by case whether to post any of them as a PR comment. Single-pass and lightweight: no subagent fan-out, no PR-number/URL target, no automated posting.

## Triggers
- review this branch
- review my branch
- review this pr
- do a quick review of this branch
- branch review

## Inputs

## Guarantees
- Resolves the default branch via `git symbolic-ref refs/remotes/origin/HEAD`, falling back to `main` then `master`, and diffs `merge-base(default, HEAD)` against the current working tree with `git diff --no-renames`, covering committed, staged, unstaged, and untracked changes on the current branch — same resolution approach as `pr-size-guard`.
- Excludes lockfiles (package-lock.json, yarn.lock, pnpm-lock.yaml, Gemfile.lock, poetry.lock, Cargo.lock, go.sum), snapshot files (*.snap, __snapshots__/), generated/build output (dist/, build/, .next/, generated/), and minified files (*.min.js, *.min.css) from review.
- If the resulting diff is empty, says so and stops — no findings are fabricated.
- For each non-excluded changed file, reads the complete current file content, not just the diff hunks, before evaluating it.
- Reviews across four fixed categories: correctness (logic errors, edge cases, missing/incorrect error handling), security (injection, auth/authz gaps, secrets, unsafe input handling), maintainability (duplication, unnecessary complexity, naming, dead code), and test coverage (missing tests for new logic/edge cases, tests that don't assert the behavior that matters).
- Single pass over the diff — no subagent fan-out, no multi-pass adversarial verification.
- Assigns each finding one of three severities — Critical (bug/security issue that should block merge), Important (real problem, not necessarily blocking), Minor (style nit or suggestion) — and reports them index-first: one line per finding (severity + file:line + short title), most severe first, no cap, expanding only the finding the user picks.
- If there are zero findings, says so directly instead of printing an empty index.
- Output goes to the chat only — never posts a PR comment, submits a GitHub review, or calls any `gh pr` / GitHub API mutation, and never edits, fixes, or refactors any code.

## Non-goals
- Does not accept a PR number, URL, or file path as a target — the currently checked-out branch is the only target.
- Does not post PR comments, submit a GitHub review, or call any `gh pr` / GitHub API mutation.
- Does not edit, fix, or refactor any code — findings only.
- Does not run linters, type checkers, or the test suite itself.
- Does not fan out to subagents or run multiple verification passes.

## Notes
See CLAUDE.md for the exact git commands, the exclusion pattern list, the per-category review checklist, and the report format template.