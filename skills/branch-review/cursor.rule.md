# Branch Review (Cursor rule)
scope: project
version: 0.1.0

Apply this rule when the user asks to:
- review this branch
- review my branch
- review this pr
- do a quick review of this branch
- branch review

When generating or editing output:
- Resolves the default branch via `git symbolic-ref refs/remotes/origin/HEAD`, falling back to `main` then `master`, and diffs `merge-base(default, HEAD)` against the current working tree with `git diff --no-renames`, covering committed, staged, unstaged, and untracked changes on the current branch — same resolution approach as `pr-size-guard`.
- Excludes lockfiles (package-lock.json, yarn.lock, pnpm-lock.yaml, Gemfile.lock, poetry.lock, Cargo.lock, go.sum), snapshot files (*.snap, __snapshots__/), generated/build output (dist/, build/, .next/, generated/), and minified files (*.min.js, *.min.css) from review.
- If the resulting diff is empty, says so and stops — no findings are fabricated.
- For each non-excluded changed file, reads the complete current file content, not just the diff hunks, before evaluating it.
- Reviews across four fixed categories: correctness (logic errors, edge cases, missing/incorrect error handling), security (injection, auth/authz gaps, secrets, unsafe input handling), maintainability (duplication, unnecessary complexity, naming, dead code), and test coverage (missing tests for new logic/edge cases, tests that don't assert the behavior that matters).
- Single pass over the diff — no subagent fan-out, no multi-pass adversarial verification.
- Assigns each finding one of three severities — Critical (bug/security issue that should block merge), Important (real problem, not necessarily blocking), Minor (style nit or suggestion) — and reports them index-first: one line per finding (severity + file:line + short title), most severe first, no cap, expanding only the finding the user picks.
- If there are zero findings, says so directly instead of printing an empty index.
- Output goes to the chat only — never posts a PR comment, submits a GitHub review, or calls any `gh pr` / GitHub API mutation, and never edits, fixes, or refactors any code.

See CLAUDE.md for the exact git commands, the exclusion pattern list, the per-category review checklist, and the report format template.

Avoid:
- Does not accept a PR number, URL, or file path as a target — the currently checked-out branch is the only target.
- Does not post PR comments, submit a GitHub review, or call any `gh pr` / GitHub API mutation.
- Does not edit, fix, or refactor any code — findings only.
- Does not run linters, type checkers, or the test suite itself.
- Does not fan out to subagents or run multiple verification passes.

# metadata
id: charlie.branch-review