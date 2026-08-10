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
