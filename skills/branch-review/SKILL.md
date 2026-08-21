---
name: branch-review
description: Reviews the currently checked-out branch's diff against the repo's default branch and reports findings locally — never posts a comment or review to GitHub or anywhere else, and never edits or fixes code. Built for reviewing someone else's work after checking out their branch. Before starting, asks the user to choose a shallow, single-pass review (reads the full content of each changed file across four categories: correctness, security, maintainability, test coverage) or an in-depth review that delegates to the code-review skill at max effort for multi-agent adversarial verification. Either way, findings are reported ranked by severity (Critical, Important, Minor) so the user can decide case by case whether to post any of them as a PR comment. Neither path accepts a PR-number/URL target, and neither posts anywhere automatically.
---

# Branch Review
version: 0.2.0

## Purpose
Reviews the currently checked-out branch's diff against the repo's default branch and reports findings locally — never posts a comment or review to GitHub or anywhere else, and never edits or fixes code. Built for reviewing someone else's work after checking out their branch. Before starting, asks the user to choose a shallow, single-pass review (reads the full content of each changed file across four categories: correctness, security, maintainability, test coverage) or an in-depth review that delegates to the code-review skill at max effort for multi-agent adversarial verification. Either way, findings are reported ranked by severity (Critical, Important, Minor) so the user can decide case by case whether to post any of them as a PR comment. Neither path accepts a PR-number/URL target, and neither posts anywhere automatically.

## Triggers
- review this branch
- review my branch
- review this pr
- do a quick review of this branch
- do an in-depth review of this branch
- do an adversarial review of this branch
- branch review

## Inputs

## Guarantees
- Before starting, asks the user to choose shallow (the single-pass review below) or in-depth (delegates to the code-review skill at max effort for multi-agent adversarial verification), skipping the question only when the invocation already states the depth (e.g. "do a quick review" means shallow, "do an in-depth/adversarial review" means in-depth).
- Resolves the default branch via `git symbolic-ref refs/remotes/origin/HEAD`, falling back to `main` then `master`, and diffs `merge-base(default, HEAD)` against the current working tree with `git diff --no-renames`, covering committed, staged, unstaged, and untracked changes on the current branch — same resolution approach as `pr-size-guard`.
- Excludes lockfiles (package-lock.json, yarn.lock, pnpm-lock.yaml, Gemfile.lock, poetry.lock, Cargo.lock, go.sum), snapshot files (*.snap, __snapshots__/), generated/build output (dist/, build/, .next/, generated/), and minified files (*.min.js, *.min.css) from review.
- If the resulting diff is empty, says so and stops — no findings are fabricated.
- On the shallow path, reads the complete current file content of each non-excluded changed file, not just the diff hunks, before evaluating it, and reviews across four fixed categories: correctness (logic errors, edge cases, missing/incorrect error handling), security (injection, auth/authz gaps, secrets, unsafe input handling), maintainability (duplication, unnecessary complexity, naming, dead code), and test coverage (missing tests for new logic/edge cases, tests that don't assert the behavior that matters).
- On the shallow path: single pass over the diff, no subagent fan-out, no multi-pass adversarial verification.
- On the in-depth path: runs the code-review skill against the current diff at max effort, passing neither --comment nor --fix, and reports whatever that skill returns in place of the shallow path's own report.
- On the shallow path, assigns each finding one of three severities — Critical (bug/security issue that should block merge), Important (real problem, not necessarily blocking), Minor (style nit or suggestion) — and reports them index-first: one line per finding (severity + file:line + short title), most severe first, no cap, expanding only the finding the user picks.
- If there are zero findings, says so directly instead of printing an empty index.
- Output goes to the chat only — never posts a PR comment, submits a GitHub review, or calls any `gh pr` / GitHub API mutation, and never edits, fixes, or refactors any code, regardless of which depth was chosen.

## Non-goals
- Does not accept a PR number, URL, or file path as a target — the currently checked-out branch is the only target, on either path.
- Does not post PR comments, submit a GitHub review, or call any `gh pr` / GitHub API mutation, on either path.
- Does not edit, fix, or refactor any code — findings only, on either path.
- Does not run linters, type checkers, or the test suite itself.
- Does not implement its own subagent fan-out or multi-pass verification; the in-depth path delegates that entirely to the code-review skill.

## Notes
See CLAUDE.md for the depth question, the exact git commands, the exclusion pattern list, the per-category review checklist, and the report format template.