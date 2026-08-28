# Branch Review — Reference

## When to invoke

The user has checked out someone else's branch locally and wants a fast, local-only review before deciding what (if anything) to post as a PR comment. Triggered by phrases like "review this branch," "review my branch," or "branch review" — never by a PR number or URL; that's out of scope for this skill.

---

## Step 0: Choose review depth

Before touching git, ask the user to pick a depth:

- **Shallow** — the single-pass review in Steps 1-5 below: reads full files once, no subagent fan-out, results in seconds.
- **In-depth** — delegates entirely to the built-in `code-review` skill at `max` effort against the current diff, which fans out multiple agents per category and adversarially verifies each finding before reporting.

Skip the question only when the invocation already states the depth: phrases like "do a quick review of this branch" mean shallow, phrases like "do an in-depth review of this branch" or "do an adversarial review of this branch" mean in-depth. Otherwise ask and wait for the answer before proceeding.

Note the naming: this is the built-in `code-review` skill (effort levels `low` through `max`, `--comment`/`--fix` flags, works against the current diff by default) — unrelated to the `code-review:code-review` plugin skill, which only reviews a GitHub pull request and always posts a comment.

If the user picks **shallow**, continue to Step 1.

If the user picks **in-depth**, run `code-review` against the current diff at `max` effort. Pass neither `--comment` (never post to GitHub) nor `--fix` (never edit code) — both non-goals hold regardless of depth. Once `code-review` finishes, stop: do not also run Steps 1-5, and do not re-render its findings in this skill's own index-first format — `code-review` already reports index-first.

## Step 1: Resolve the diff

Resolve the default branch:

```bash
DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@')
DEFAULT_BRANCH=${DEFAULT_BRANCH:-main}
git show-ref --verify --quiet "refs/remotes/origin/$DEFAULT_BRANCH" || DEFAULT_BRANCH=master
```

Update the local view of the default branch before diffing against it — otherwise a stale `origin/$DEFAULT_BRANCH` ref makes the diff include commits already merged upstream, producing findings on code the branch didn't actually introduce:

```bash
git fetch origin "$DEFAULT_BRANCH" --quiet
```

This only updates the remote-tracking ref; it doesn't touch the working tree, the current branch, or any local branch named `$DEFAULT_BRANCH`. If the fetch fails (e.g. no network), continue with whatever `origin/$DEFAULT_BRANCH` is already present locally and note in the final report that the default branch may be stale.

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

If that diff's header includes a `deleted file mode` line, the file no longer exists in the working tree — do not attempt to Read it. Review it from the diff hunk alone; the hunk already contains the full old content as removed lines.

Otherwise, read the complete current file content with the Read tool — not just the hunk. A changed function's correctness often depends on a helper defined elsewhere in the same file, which a hunk alone won't show.

For each surviving untracked file, read the complete file with the Read tool and treat the whole thing as newly added.

Because Step 1 uses `--no-renames`, a pure rename shows up as two separate entries: a full delete of the old path and a full add of the new path with the same (or near-identical) content. Recognize this pattern and treat it as one rename, not two changes — don't report a large-deletion finding for the old path and a separate new-file/no-tests finding for the new path.

## Step 3: Review across four categories

For every file from Step 2, check each category. Do not skip a category because the diff "looks like" only one kind of change — a pure refactor can still introduce a correctness bug.

| Category | Look for |
|---|---|
| Correctness | Logic errors, off-by-one and boundary conditions, edge cases (empty/null/zero/duplicate input), missing or wrong error handling, incorrect assumptions about caller behavior or data shape |
| Security | Injection (SQL, shell, template), auth/authz gaps (missing permission check, broken access control), hardcoded secrets or credentials, unsafe handling of user-controlled input (path traversal, unescaped output) |
| Maintainability | Duplicated logic that already exists elsewhere in the file or repo, unnecessary complexity for what the change needs, unclear or misleading naming, dead code left behind |
| Test coverage | New logic or edge cases with no corresponding test, tests that execute code but don't assert the behavior that actually matters (e.g. only checking "it doesn't throw") |

Single pass: form a judgment on each file once. Do not re-review a file a second time looking for what you missed, and do not spawn subagents for this — that is what keeps the shallow path lightweight rather than duplicating the in-depth path's delegation to `code-review`.

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

- Never posts a PR comment, submits a GitHub review, or calls any `gh pr` / GitHub API mutation — output goes to the chat only, on either path.
- Never edits, fixes, or refactors any code, on either path.
- Never runs linters, type checkers, or the test suite itself.
- Never accepts a PR number, URL, or file path as a target — the currently checked-out branch is the only target, on either path.
- Never implements its own subagent fan-out or multi-pass verification; the in-depth path delegates that entirely to `code-review`.
