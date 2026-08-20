# Standup Summary — Design Spec

Date: 2026-08-20

## Purpose

Writing a daily standup update means manually reconstructing what happened yesterday across Jira and GitHub, then guessing at a concise phrasing. This skill generates that update directly from your actual activity — a "yesterday / today / blockers" message, one or two sentences per section, ready to paste into standup.

## Scope

New skill at `skills/standup-summary/`:
- `skill.json` — source of truth
- `SKILL.md`, `cursor.rule.md` — generated via `npm run gen`
- `CLAUDE.md` — the exact `gh` and Jira JQL queries, time-window computation, and output format

Added to the general skills table in `README.md` per the `skill-maintenance` skill's convention.

`scope: global`, no tags. Runs from any directory — activity is scoped by GitHub org and Jira account, not by the current repo.

## Trigger

Explicit request only: "generate my standup," "daily standup," "standup message," `/standup-summary`. Never proactive.

## Approach

Direct inline fetch: the skill's `CLAUDE.md` documents exact `gh api` calls and Jira JQL, run straight in the main conversation — no subagent dispatch, no separate wrapper scripts. A single day's activity across one GitHub search and a couple of JQL queries is small enough that a subagent's isolation overhead isn't justified (contrast with `sdlc-jira-github:check-my-prs`, which dispatches a subagent because it can pull much larger, noisier PR-thread output). Wrapper shell scripts are also premature for a single skill; if a second Jira/GitHub-querying skill is added later, extracting shared scripts becomes worth it then.

## Config

The first skill in this repo needing state that isn't project-scoped. Stored at `~/.claude/standup.json`:

```json
{
  "jira": { "cloudId": "your-team.atlassian.net" },
  "github": { "org": "your-github-org" }
}
```

- `jira.cloudId` — required. No auto-discovery is possible (same constraint `sdlc`'s Config Resolution documents) — ask the user directly the first time the file is missing or the field is absent, then write it back to the file so it's asked only once.
- `github.org` — optional. If present, scopes the GitHub search to that org (`org:<value>` added to the query). If absent, the search runs unscoped across every repo the user's `gh` token can see. On first run (config file missing), ask once whether to scope to a GitHub org, defaulting to unscoped if left blank, and write whatever is chosen to the file so it isn't asked again.
- GitHub username (`gh api user --jq .login`) and Jira account ID (via `atlassianUserInfo`) are always fetched live, never stored — they can't drift, so caching them only risks staleness.

Before calling `searchJiraIssuesUsingJql`, load it via `ToolSearch` first (`select:mcp__atlassian__searchJiraIssuesUsingJql`) — same object-type-parameter requirement documented in `sdlc`'s CLAUDE.md.

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

## Data sources

**GitHub** (`gh api search/issues -f q="..."`, letting `gh` handle query-string encoding):
- Yesterday: `is:pr involves:@me updated:>=$window_start updated:<$window_end` (+ `org:<github.org>` if configured) — catches PRs opened, commented on, or reviewed in the window.
- Today: `is:pr author:@me is:open` (+ `org:<github.org>` if configured) — PRs they authored that are still open.
- Blockers: `is:pr author:@me is:open status:failure` (+ `org:<github.org>` if configured) — their open PRs with failing CI.

**Jira** (`searchJiraIssuesUsingJql` with the configured `cloudId`):
- Yesterday: `assignee = currentUser() AND updated >= "$window_start" AND updated < "$window_end" ORDER BY updated DESC`
- Today: `assignee = currentUser() AND statusCategory = "In Progress" ORDER BY updated DESC` — the status *category*, not a literal status name, since literal names vary by project (one project might use `In_Progress` with underscores, another "In Dev," another something else entirely). The category is standardized across every project in a Jira instance.
- Blockers: `assignee = currentUser() AND statusCategory != Done AND (flagged is not EMPTY OR status = "Blocked") ORDER BY updated DESC` — checks both the built-in Impediment flag and a literal `"Blocked"` workflow status, since Jira has no standardized "blocked" status category the way it does for To Do/In Progress/Done.
  - **Per-clause graceful degradation:** if `flagged` isn't a valid field on this instance, or no status literally named `"Blocked"` exists, JQL errors on that specific clause. Drop only the failing clause and retry with the other; only fall back to relying on the GitHub CI-failure signal alone if both clauses turn out invalid.

## Output format

Three labeled sections, one or two sentences each, synthesized rather than listed item-by-item. If a section surfaces more than a couple of items, pick the highest-value ones instead of enumerating everything — this mirrors the user's own framing: not exhaustive, just the high points.

```
**Yesterday:** Merged the pagination fix for the reports API (PR #482) and moved PROJ-521 (bulk export bug) to Done after review feedback.

**Today:** Continuing PROJ-530 (rate limiter refactor) and following up on the open PR for the webhook retry logic (#491).

**Blockers:** None noted.
```

When blockers are found, name the specific ticket/PR and the concrete reason (failing CI, flagged, or `Blocked` status) rather than a generic "there are blockers" statement.

Printed in chat only — no posting to Slack or anywhere else, no file written beyond the config file above.

## Non-goals

- Entirely read-only: never transitions a Jira ticket, never comments on a PR or ticket, never posts anywhere.
- Does not ask the user to manually state what they're working on — the "today" section is derived entirely from current in-progress Jira tickets and open authored PRs.
- Does not attempt cross-timezone "yesterday" reasoning beyond the last-working-day rule — uses the local machine's date.
- Does not depend on the `sdlc-jira-github` plugin or any other plugin.
