# Standup Summary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new skill, `standup-summary`, that generates a concise "yesterday / today / blockers" standup message from the user's actual Jira and GitHub activity, on explicit request.

**Architecture:** This is a declarative content skill (`skill.json` → generated `SKILL.md`/`cursor.rule.md`, plus a `CLAUDE.md` reference doc), not application code — there is no unit-test framework for it. The verification cycle for each task is write → validate/generate → inspect the actual output → commit, using this repo's own tooling (`npm run validate`, `npm run gen`) as the check, in place of a test runner.

**Tech Stack:** Node scripts already in the repo (`scripts/validateSkill.js`, `scripts/generateSkillFiles.js`); `gh` CLI and the Atlassian MCP (`searchJiraIssuesUsingJql`, `atlassianUserInfo`) at runtime — no new dependencies added to this repo.

**Spec:** `docs/superpowers/specs/2026-08-20-standup-summary-design.md`

## Global Constraints

- `scope: "global"`, no `tags` (per design spec) — runs from any directory.
- Config lives at `~/.claude/standup.json`: `jira.cloudId` (required, no auto-discovery — ask once, then persist) and `github.org` (optional — ask once on first run whether to scope the GitHub search, defaulting to unscoped if left blank, then persist).
- GitHub username (`gh api user --jq .login`) and Jira account ID (`atlassianUserInfo`) are always fetched live, never cached in the config file.
- "Yesterday" means the last working day: Monday looks back to Friday; any other day looks back one calendar day.
- Exact query strings (copied verbatim from the spec, no drift allowed):
  - GitHub yesterday: `is:pr involves:@me updated:>=<window_start> updated:<<window_end>` (+ `org:<github.org>` if configured)
  - GitHub today: `is:pr author:@me is:open` (+ `org:<github.org>` if configured)
  - GitHub blockers: `is:pr author:@me is:open status:failure` (+ `org:<github.org>` if configured)
  - Jira yesterday: `assignee = currentUser() AND updated >= "<window_start>" AND updated < "<window_end>" ORDER BY updated DESC`
  - Jira today: `assignee = currentUser() AND statusCategory = "In Progress" ORDER BY updated DESC`
  - Jira blockers: `assignee = currentUser() AND statusCategory != Done AND (flagged is not EMPTY OR status = "Blocked") ORDER BY updated DESC`, with per-clause graceful degradation (drop only the clause that errors; fall back to the GitHub CI-failure signal alone only if both clauses are invalid).
- Output: three labeled sections (Yesterday/Today/Blockers), one or two sentences each, synthesized rather than listed item-by-item. Chat-only — never posts anywhere, never writes any file besides the config file above.
- Entirely read-only: never transitions a Jira ticket, never comments on a PR or ticket.
- Never hand-edit `SKILL.md` or `cursor.rule.md` — only `skill.json`, then regenerate (per `skill-maintenance` skill).
- README.md skills table gets a new row per the `skill-maintenance` skill's format: `| [skill-name](skills/path/) | One-line description matching the skill.json description field. |` — trimmed to a one-liner per the existing table's precedent, not copied verbatim in full.
- No employer-identifying strings anywhere in this skill's content — this repo is public. Use generic placeholders (`your-team.atlassian.net`, `your-github-org`, `PROJ-1234`) in every example.

---

### Task 1: Create `skill.json` and generate `SKILL.md` / `cursor.rule.md`

**Files:**
- Create: `skills/standup-summary/skill.json`
- Create (generated): `skills/standup-summary/SKILL.md`
- Create (generated): `skills/standup-summary/cursor.rule.md`

**Interfaces:**
- Consumes: none (first task).
- Produces: `skills/standup-summary/skill.json` with fields `id`, `title`, `version`, `description`, `triggers`, `guarantees`, `non_goals`, `notes` — Task 2's `CLAUDE.md` must implement exactly the query strings, config schema, and time-window rule named in this file's `guarantees`, with no drift.

- [ ] **Step 1: Write `skills/standup-summary/skill.json`**

```json
{
  "scope": "global",
  "id": "charlie.standup-summary",
  "title": "Standup Summary",
  "version": "0.1.0",
  "description": "Generates a concise daily standup message — yesterday / today / blockers, one or two sentences each — from the user's actual Jira and GitHub activity, on explicit request. Scoped account-wide (not to the current repo): reads a small global config (~/.claude/standup.json) for the Jira cloud ID and an optional GitHub org to scope the search, asking once on first run and persisting the answer. \"Yesterday\" means the last working day, so Monday shows Friday's activity instead of an empty Sunday. \"Today\" is derived entirely from current in-progress Jira tickets and open authored PRs — never asks the user to state their plan. Blockers combine a Jira flagged/Blocked-status check with a GitHub CI-failure check on the user's own open PRs. Entirely read-only and chat-only: never transitions a ticket, never comments, never posts anywhere.",
  "triggers": [
    "generate my standup",
    "daily standup",
    "standup message",
    "standup update",
    "what did i work on yesterday",
    "/standup-summary"
  ],
  "guarantees": [
    "Reads ~/.claude/standup.json for jira.cloudId (required) and github.org (optional); if the file or a required field is missing, asks the user directly (no auto-discovery is possible for either field) and writes the answer back so it's asked only once.",
    "Fetches the GitHub username (gh api user --jq .login) and Jira account ID (atlassianUserInfo) live on every run — never caches identity in the config file.",
    "Computes the time window as the last working day: Monday looks back to the prior Friday; any other day looks back one calendar day.",
    "Yesterday section: GitHub search 'is:pr involves:@me updated:>=<window_start> updated:<<window_end>' (+ org filter if configured) and Jira JQL 'assignee = currentUser() AND updated >= \"<window_start>\" AND updated < \"<window_end>\"'.",
    "Today section: GitHub search 'is:pr author:@me is:open' (+ org filter if configured) and Jira JQL 'assignee = currentUser() AND statusCategory = \"In Progress\"' — using the status category rather than a literal status name, since literal names vary by project.",
    "Blockers section: GitHub search 'is:pr author:@me is:open status:failure' (+ org filter if configured) and Jira JQL checking both the flagged field and a literal 'Blocked' status; if either JQL clause errors because the field/status doesn't exist on this instance, drops only that clause and keeps the other, falling back to the GitHub signal alone only if both are invalid.",
    "Produces three labeled sections (Yesterday/Today/Blockers), one or two sentences each, synthesized rather than listing every item found — picks the highest-value points when a section surfaces more than a couple of items.",
    "Chat-only output: never posts to Slack or anywhere else, never writes a file beyond the config file above.",
    "Entirely read-only: never transitions a Jira ticket, never comments on a PR or ticket."
  ],
  "non_goals": [
    "Does not ask the user to manually state what they're working on — the today section is derived entirely from current in-progress Jira tickets and open authored PRs.",
    "Does not post the generated message anywhere — chat output only.",
    "Does not transition Jira ticket status or comment on tickets/PRs.",
    "Does not depend on the sdlc-jira-github plugin or any other plugin.",
    "Does not attempt cross-timezone \"yesterday\" reasoning beyond the last-working-day rule — uses the local machine's date."
  ],
  "notes": "See CLAUDE.md for the exact gh/JQL query strings, the time-window computation, the config file schema and first-run setup flow, and the output format template."
}
```

- [ ] **Step 2: Validate the skill.json**

Run: `npm run validate -- skills/standup-summary/skill.json`
Expected output: `OK charlie.standup-summary` (exit code 0). If it instead reports missing fields or a bad version string, fix `skill.json` and re-run.

- [ ] **Step 3: Generate SKILL.md and cursor.rule.md**

Run: `npm run gen`
Expected output includes the line: `  skills/standup-summary: SKILL.md, cursor.rule.md`

- [ ] **Step 4: Verify the generated files**

Run: `cat skills/standup-summary/SKILL.md`

Expected: frontmatter with `name: standup-summary` and `description:` matching the `skill.json` description verbatim, followed by a `# Standup Summary` heading, `version: 0.1.0`, `## Purpose` / `## Triggers` populated, an empty `## Inputs` heading with no bullets beneath it (this skill takes no input parameters, so `skill.json` has no `inputs` field), then `## Guarantees` / `## Non-goals` / `## Notes` populated from the fields written in Step 1. Confirm every section except `## Inputs` is non-empty and nothing was hand-edited.

- [ ] **Step 5: Commit**

```bash
git add skills/standup-summary/skill.json skills/standup-summary/SKILL.md skills/standup-summary/cursor.rule.md
git commit -m "Add standup-summary skill.json and generated files"
```

---

### Task 2: Write `CLAUDE.md` reference doc

**Files:**
- Create: `skills/standup-summary/CLAUDE.md`

**Interfaces:**
- Consumes: the exact query strings, config field names, and time-window rule from Task 1's `skill.json` `guarantees` — this doc must not introduce different query text or a different config schema.
- Produces: the execution procedure that `SKILL.md`'s `notes` field points readers to; no other task depends on this file's internals, but its output-format template must match what a user invoking the skill will actually see.

- [ ] **Step 1: Write `skills/standup-summary/CLAUDE.md`**

```markdown
# Standup Summary — Reference

## When to invoke

Explicit request only: "generate my standup," "daily standup," "standup message," "standup update," "what did I work on yesterday," or `/standup-summary`. Never proactive.

## Config Resolution

Read `~/.claude/standup.json` if present:

```bash
cat ~/.claude/standup.json 2>/dev/null
```

Fields: `jira.cloudId` (required), `github.org` (optional).

Example file:

```json
{
  "jira": { "cloudId": "your-team.atlassian.net" },
  "github": { "org": "your-github-org" }
}
```

**First-run setup** (file missing, or `jira.cloudId` absent from it):
1. `jira.cloudId` — no automatic discovery is possible: ask the user directly (e.g. "What's the Jira cloud ID? e.g. your-team.atlassian.net").
2. `github.org` — ask once whether to scope the GitHub search to a specific org. Leaving it blank means the search runs unscoped across every repo the user's `gh` token can see; store that choice as an explicit empty value so it isn't asked again.
3. Write both answers to `~/.claude/standup.json`, creating the file (and `~/.claude/` if somehow absent) if it doesn't exist yet.

**Live identity lookups** (never cached — run every invocation):

```bash
gh api user --jq .login
```

For the Jira account ID, call `atlassianUserInfo` (load it via `ToolSearch` first: `select:mcp__atlassian__atlassianUserInfo`).

Before calling `searchJiraIssuesUsingJql`, load it via `ToolSearch` first (`select:mcp__atlassian__searchJiraIssuesUsingJql`) — without this, calls fail with cryptic type errors.

## Time window

"Yesterday" means the last working day, so Monday shows Friday's activity instead of an empty Sunday:

```bash
dow=$(date +%u)  # 1=Mon .. 7=Sun
if [ "$dow" -eq 1 ]; then
  window_start=$(date -v-3d +%Y-%m-%d)  # Monday -> Friday
else
  window_start=$(date -v-1d +%Y-%m-%d)
fi
window_end=$(date +%Y-%m-%d)  # exclusive upper bound
```

Compute this once per invocation; reuse `window_start`/`window_end` in both the GitHub and Jira queries below.

## Data sources

### Yesterday

GitHub (`gh api search/issues -f q="..."`, letting `gh` handle query-string encoding):

```bash
gh api search/issues -f q="is:pr involves:@me updated:>=$window_start updated:<$window_end" --jq '[.items[] | {number, title, url: .html_url, repo: .repository_url}]'
```

Append ` org:<github.org>` to the `q` value if `github.org` is configured.

Jira JQL (via `searchJiraIssuesUsingJql`, substituting the actual computed dates for `<window_start>`/`<window_end>`):

```
assignee = currentUser() AND updated >= "<window_start>" AND updated < "<window_end>" ORDER BY updated DESC
```

### Today

GitHub:

```bash
gh api search/issues -f q="is:pr author:@me is:open" --jq '[.items[] | {number, title, url: .html_url, repo: .repository_url}]'
```

Same org-suffix rule as above.

Jira JQL:

```
assignee = currentUser() AND statusCategory = "In Progress" ORDER BY updated DESC
```

Uses the status *category*, not a literal status name, since literal names vary by project (one project might use `In_Progress` with underscores, another "In Dev," another something else entirely). The category is standardized across every project in a Jira instance.

### Blockers

GitHub:

```bash
gh api search/issues -f q="is:pr author:@me is:open status:failure" --jq '[.items[] | {number, title, url: .html_url, repo: .repository_url}]'
```

Same org-suffix rule as above.

Jira JQL:

```
assignee = currentUser() AND statusCategory != Done AND (flagged is not EMPTY OR status = "Blocked") ORDER BY updated DESC
```

Checks both the built-in Impediment flag and a literal `"Blocked"` workflow status, since Jira has no standardized "blocked" status category the way it does for To Do/In Progress/Done.

**Per-clause graceful degradation:** if `flagged` isn't a valid field on this instance, or no status literally named `"Blocked"` exists, JQL errors on that specific clause. Drop only the failing clause and retry with the other; only fall back to relying on the GitHub CI-failure signal alone if both clauses turn out invalid.

## Output format

Three labeled sections, one or two sentences each, synthesized rather than listed item-by-item. If a section surfaces more than a couple of items, pick the highest-value ones instead of enumerating everything.

```
**Yesterday:** Merged the pagination fix for the reports API (PR #482) and moved PROJ-521 (bulk export bug) to Done after review feedback.

**Today:** Continuing PROJ-530 (rate limiter refactor) and following up on the open PR for the webhook retry logic (#491).

**Blockers:** None noted.
```

When blockers are found, name the specific ticket/PR and the concrete reason (failing CI, flagged, or `Blocked` status) rather than a generic "there are blockers" statement.

Printed in chat only — no posting to Slack or anywhere else, no file written beyond the config file above.

## Non-goals

- Entirely read-only: never transitions a Jira ticket, never comments on a PR or ticket, never posts anywhere.
- Does not ask the user to manually state what they're working on — the today section is derived entirely from current in-progress Jira tickets and open authored PRs.
- Does not attempt cross-timezone "yesterday" reasoning beyond the last-working-day rule — uses the local machine's date.
- Does not depend on the sdlc-jira-github plugin or any other plugin.
```

- [ ] **Step 2: Verify against skill.json**

Confirm the config field names (`jira.cloudId`, `github.org`), the six query strings (GitHub yesterday/today/blockers, Jira yesterday/today/blockers), and the last-working-day rule in `CLAUDE.md` match `skills/standup-summary/skill.json`'s `guarantees` field exactly — no drift between the two files.

- [ ] **Step 3: Commit**

```bash
git add skills/standup-summary/CLAUDE.md
git commit -m "Add standup-summary CLAUDE.md reference doc"
```

---

### Task 3: Update `README.md`

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: `skills/standup-summary/skill.json`'s `description` field (trimmed to a one-liner, per the existing table's precedent — not copied verbatim in full).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Add the row to the general skills table**

Add a new row directly after the `sdlc` row:

```
| [standup-summary](skills/standup-summary/)                                  | Generate a concise yesterday/today/blockers standup message from your actual Jira and GitHub activity, scoped account-wide. Chat output only, entirely read-only. |
```

- [ ] **Step 2: Verify**

Run: `grep -n "standup-summary" README.md`
Expected: one match, the row just added, with a working relative link `skills/standup-summary/`.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "Add standup-summary to skills README table"
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
Expected: every skill (including `standup-summary`) reports `OK <id>` from validation, generation reports a file pair for every skill directory including `skills/standup-summary`, and the command exits 0.

- [ ] **Step 2: Confirm no unintended diff from regeneration**

Run: `git status`
Expected: clean working tree (no changes) — regeneration in Step 1 must be a no-op since nothing changed since Task 3's commit. If `git diff` shows changes to any other skill's `SKILL.md`/`cursor.rule.md`, investigate before proceeding — it means the generator behavior changed, not just this new skill's content.

- [ ] **Step 3: Confirm no employer-identifying strings leaked in**

Run: `grep -rniI "guild\|POU-[0-9]" skills/standup-summary/ docs/superpowers/specs/2026-08-20-standup-summary-design.md docs/superpowers/plans/2026-08-20-standup-summary.md`
Expected: no matches (this repo is public — see the design spec's redaction history for why this check exists).

- [ ] **Step 4: Report completion**

Summarize to the user: the new skill's location, its three trigger-free-form phrases plus `/standup-summary`, the config file it creates on first use (`~/.claude/standup.json`), and that `npm run ci` passes clean. Do not claim "done" without having actually run and observed the Step 1, Step 2, and Step 3 output in this session (per `superpowers:verification-before-completion`).
