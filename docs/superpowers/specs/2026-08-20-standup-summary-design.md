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

Requires an authenticated `gh` CLI and a connected Atlassian MCP server — the skill talks to both directly.

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

- `jira.cloudId` and `github.org` are checked and asked for independently, not gated on the same "file missing" condition — a file that already has one field set still triggers a prompt for the other field if that one is absent.
- `jira.cloudId` — required. No auto-discovery is possible (same constraint `sdlc`'s Config Resolution documents) — ask the user directly the first time the field is absent, then merge the answer into the existing file (never overwrite it wholesale) so it's asked only once.
- `github.org` — optional. If present and non-empty, scopes the GitHub search to that org (`org:<value>` added to the query). If absent or an empty string, the search runs unscoped across every repo the user's `gh` token can see, and the `org:` qualifier is left out of the query entirely — a bare `org:` with nothing after it is a 422 from the GitHub search API. On first run, ask once whether to scope to a GitHub org, defaulting to an explicit empty string if left blank, and merge whatever is chosen into the file so it isn't asked again.
- GitHub identity resolves via the `@me` qualifier and Jira identity via `currentUser()` in every query below, so no separate identity lookup (GitHub username, Jira account ID) is needed or performed.

Before calling `searchJiraIssuesUsingJql`, load it via `ToolSearch` first (`select:mcp__atlassian__searchJiraIssuesUsingJql`) — same object-type-parameter requirement documented in `sdlc`'s CLAUDE.md.

## Time window

"Yesterday" means the last working day, so Monday shows Friday's activity instead of an empty Sunday:

```bash
dow=$(date +%u)  # 1=Mon .. 7=Sun
if [ "$dow" -eq 1 ]; then
  window_start=$(date -v-3d +%Y-%m-%d)  # Monday -> Friday
elif [ "$dow" -eq 7 ]; then
  window_start=$(date -v-2d +%Y-%m-%d)  # Sunday -> Friday
else
  window_start=$(date -v-1d +%Y-%m-%d)
fi
window_end=$(date +%Y-%m-%d)  # exclusive upper bound, Jira only
```

`date -v` is macOS/BSD `date` syntax; a Linux environment needs the GNU equivalents instead (e.g. `date -d '1 day ago' +%Y-%m-%d`). Bash tool invocations in Claude Code don't share shell state across separate calls, so the GitHub query below recomputes `window_start` inline rather than relying on this block having run first; the Jira JQL below substitutes the literal computed date values directly into the JQL text, which has no such shell-state dependency.

## Data sources

**GitHub** (`gh api --method GET search/issues -f q="..."` — `--method GET` is required to force the `-f` parameters into the query string; without it, `gh api` defaults to a POST body once any `-f` parameter is present, and the search endpoint 404s):
- Yesterday: `is:pr author:@me updated:$window_start..$window_start` (+ `org:<github.org>` if configured and non-empty) — `author:@me`, not `involves:@me`: `involves` also matches PRs merely commented on or approved, which misrepresents review activity as authored work. A single same-day `..` range qualifier, since GitHub search ORs repeated occurrences of the same qualifier rather than ANDing them (two separate `updated:>=`/`updated:<` qualifiers match the union, not the intersection, and the date filter silently matches everything). The same-day range already covers the whole day, so no second variable is needed on the GitHub side.
- Today: `is:pr author:@me is:open` (+ `org:<github.org>` if configured and non-empty) — PRs they authored that are still open.
- Blockers: `is:pr author:@me is:open status:failure` (+ `org:<github.org>` if configured and non-empty) — their open PRs with failing CI.

**Jira** (`searchJiraIssuesUsingJql` with the configured `cloudId`):
- Yesterday: `assignee = currentUser() AND updated >= "$window_start" AND updated < "$window_end" ORDER BY updated DESC`
- Today: `assignee = currentUser() AND statusCategory = "In Progress" ORDER BY updated DESC` — the status *category*, not a literal status name, since literal names vary by project (one project might use `In_Progress` with underscores, another "In Dev," another something else entirely). The category is standardized across every project in a Jira instance.
- Blockers: `assignee = currentUser() AND statusCategory != Done AND (flagged is not EMPTY OR status = "Blocked") ORDER BY updated DESC` — checks both the built-in Impediment flag and a literal `"Blocked"` workflow status, since Jira has no standardized "blocked" status category the way it does for To Do/In Progress/Done.
  - **Per-clause graceful degradation:** if `flagged` isn't a valid field on this instance, or no status literally named `"Blocked"` exists, JQL errors on that specific clause. Drop only the failing clause and retry with the other — `assignee = currentUser() AND statusCategory != Done AND flagged is not EMPTY ORDER BY updated DESC` with only the `flagged` clause, or `assignee = currentUser() AND statusCategory != Done AND status = "Blocked" ORDER BY updated DESC` with only the `status = "Blocked"` clause. Only fall back to relying on the GitHub CI-failure signal alone if both clauses turn out invalid.

## Output format

Three labeled sections, one or two sentences each, synthesized rather than listed item-by-item. If a section surfaces more than a couple of items, pick the highest-value ones instead of enumerating everything — this mirrors the user's own framing: not exhaustive, just the high points.

Written for a reader without Jira access — a manager or teammate skimming the update should follow what was done without looking anything up. Each bullet leads with the plain-language description of the work; a ticket or PR number is a trailing reference, never the subject a bullet opens with.

```
**Yesterday:** Merged the pagination fix for the reports API (PR #482) and fixed a bug where bulk exports could get stuck in progress (PROJ-521).

**Today:** Continuing the rate limiter refactor (PROJ-530) and following up on the open PR for the webhook retry logic (#491).

**Blockers:** None noted.
```

When blockers are found, describe the concrete reason (failing CI, flagged, or `Blocked` status) in plain language first, with the specific ticket/PR referenced alongside it — not a generic "there are blockers" statement.

Printed in chat only — no posting to Slack or anywhere else, no file written beyond the config file above.

## Non-goals

- Entirely read-only: never transitions a Jira ticket, never comments on a PR or ticket, never posts anywhere.
- Does not ask the user to manually state what they're working on — the "today" section is derived entirely from current in-progress Jira tickets and open authored PRs.
- Does not attempt cross-timezone "yesterday" reasoning beyond the last-working-day rule — uses the local machine's date.
- Does not depend on the `sdlc-jira-github` plugin or any other plugin.
