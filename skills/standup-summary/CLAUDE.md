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
