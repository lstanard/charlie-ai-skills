# Standup Summary — Reference

## When to invoke

Explicit request only: "generate my standup," "daily standup," "standup message," "standup update," "what did I work on yesterday," or `/standup-summary`. Never proactive.

**Prerequisites:** requires an authenticated `gh` CLI (`gh auth status` succeeds) and a connected Atlassian MCP server (the `mcp__atlassian__*` tools resolve). Without both, config resolution and every query below fail.

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

An unset `github.org` is stored as an explicit empty string, not omitted from the file:

```json
{
  "jira": { "cloudId": "your-team.atlassian.net" },
  "github": { "org": "" }
}
```

An empty or absent `github.org` means the org qualifier is left out of every GitHub query entirely. Never emit `org:` with nothing after it — `gh api --method GET search/issues -f q="...org:"` fails with a 422 Validation Failed.

**First-run setup.** `jira.cloudId` and `github.org` are each checked and asked for independently — a file that already has one field set still gets asked about the other field if that one is missing, rather than skipping setup entirely just because the file exists:
1. If `jira.cloudId` is absent: no automatic discovery is possible — ask the user directly (e.g. "What's the Jira cloud ID? e.g. your-team.atlassian.net").
2. If `github.org` is absent: ask once whether to scope the GitHub search to a specific org. Leaving it blank means the search runs unscoped across every repo the user's `gh` token can see; store that choice as the explicit empty string shown above so it isn't asked again.
3. Write whichever answer(s) were just collected back to `~/.claude/standup.json`, merging into the file's existing contents rather than overwriting it — a field the user already configured must survive a run that only needed to ask about the other field. Create the file (and `~/.claude/` if somehow absent) if it doesn't exist yet.

Before calling `searchJiraIssuesUsingJql`, load it via `ToolSearch` first (`select:mcp__atlassian__searchJiraIssuesUsingJql`) — without this, calls fail with cryptic type errors.

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

`date -v` is macOS/BSD `date` syntax. On Linux, use the GNU equivalents instead, e.g. `date -d '1 day ago' +%Y-%m-%d`.

Compute this once conceptually per invocation. For the Jira JQL below, substitute the literal computed `window_start`/`window_end` values directly into the JQL text passed to the MCP tool — that substitution happens as part of the same tool call, so there's no shell-state problem. For the GitHub `gh api` commands below, Bash tool invocations do not share shell state across separate calls (only the working directory persists), so the GitHub "Yesterday" code block below recomputes `window_start` inline, in the same call as the `gh api` command.

## Data sources

### Yesterday

GitHub (`gh api --method GET search/issues -f q="..."`): `--method GET` is what forces the `-f` parameters into the query string. Without it, `gh api` defaults to a POST body once any `-f` parameter is present, and the search endpoint 404s.

```bash
dow=$(date +%u)
if [ "$dow" -eq 1 ]; then
  window_start=$(date -v-3d +%Y-%m-%d)
elif [ "$dow" -eq 7 ]; then
  window_start=$(date -v-2d +%Y-%m-%d)
else
  window_start=$(date -v-1d +%Y-%m-%d)
fi
gh api --method GET search/issues -f q="is:pr author:@me updated:$window_start..$window_start" --jq '[.items[] | {number, title, url: .html_url, repo: .repository_url}]'
```

Run the date computation and the `gh api` call in the same tool invocation — Bash tool calls don't share shell state, so a `window_start` set in an earlier call is empty here.

Use `author:@me`, not `involves:@me`. GitHub's `involves` qualifier is a shorthand for author, assignee, mentions, *and* commenter — approving or commenting on someone else's PR counts as "commenter," so `involves:@me` surfaces PRs you reviewed as if they were PRs you worked on. `author:@me` restricts this to PRs you actually opened.

Use a single `updated:$window_start..$window_start` range qualifier, not two separate `updated:>=`/`updated:<` qualifiers. GitHub search ORs repeated occurrences of the same qualifier rather than ANDing them, so two `updated:` clauses match the union of both instead of the intersection and the date filter silently matches everything. A same-day `..` range already covers the whole day, so no second variable is needed on the GitHub side.

Append ` org:<github.org>` to the `q` value if `github.org` is configured and non-empty; omit it entirely otherwise.

Jira JQL (via `searchJiraIssuesUsingJql`, substituting the actual computed dates for `<window_start>`/`<window_end>`):

```
assignee = currentUser() AND updated >= "<window_start>" AND updated < "<window_end>" ORDER BY updated DESC
```

### Today

GitHub:

```bash
gh api --method GET search/issues -f q="is:pr author:@me is:open" --jq '[.items[] | {number, title, url: .html_url, repo: .repository_url}]'
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
gh api --method GET search/issues -f q="is:pr author:@me is:open status:failure" --jq '[.items[] | {number, title, url: .html_url, repo: .repository_url}]'
```

Same org-suffix rule as above.

Jira JQL:

```
assignee = currentUser() AND statusCategory != Done AND (flagged is not EMPTY OR status = "Blocked") ORDER BY updated DESC
```

Checks both the built-in Impediment flag and a literal `"Blocked"` workflow status, since Jira has no standardized "blocked" status category the way it does for To Do/In Progress/Done.

**Per-clause graceful degradation:** if `flagged` isn't a valid field on this instance, or no status literally named `"Blocked"` exists, JQL errors on that specific clause. Drop only the failing clause and retry with the other:

Only the `flagged` clause:
```
assignee = currentUser() AND statusCategory != Done AND flagged is not EMPTY ORDER BY updated DESC
```

Only the `status = "Blocked"` clause:
```
assignee = currentUser() AND statusCategory != Done AND status = "Blocked" ORDER BY updated DESC
```

Only fall back to relying on the GitHub CI-failure signal alone if both clauses turn out invalid.

## Output format

Three labeled sections, one or two sentences each, synthesized rather than listed item-by-item. If a section surfaces more than a couple of items, pick the highest-value ones instead of enumerating everything.

Write for a reader who doesn't have Jira open — a manager or teammate skimming the update should understand what was done without looking anything up. Lead with the plain-language description of the work (what it is, in a sentence a non-technical reader could follow); a ticket or PR number is a trailing reference, not the subject of the sentence. Never open a bullet with a bare ticket ID.

```
**Yesterday:** Merged the pagination fix for the reports API (PR #482) and fixed a bug where bulk exports could get stuck in progress (PROJ-521).

**Today:** Continuing the rate limiter refactor (PROJ-530) and following up on the open PR for the webhook retry logic (#491).

**Blockers:** None noted.
```

When blockers are found, describe the concrete reason (failing CI, flagged, or `Blocked` status) in plain language first, with the specific ticket/PR referenced alongside it — not a generic "there are blockers" statement.

Printed in chat only — no posting to Slack or anywhere else, no file written beyond the config file above.

## Non-goals

- Entirely read-only: never transitions a Jira ticket, never comments on a PR or ticket, never posts anywhere.
- Does not ask the user to manually state what they're working on — the today section is derived entirely from current in-progress Jira tickets and open authored PRs.
- Does not attempt cross-timezone "yesterday" reasoning beyond the last-working-day rule — uses the local machine's date.
- Does not depend on the sdlc-jira-github plugin or any other plugin.
