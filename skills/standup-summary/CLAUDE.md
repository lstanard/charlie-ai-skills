# Standup Summary — Reference

## When to invoke

Explicit request only: "generate my standup," "daily standup," "standup message," "standup update," "what did I work on yesterday," or `/standup-summary`. Never proactive.

**Prerequisites:** requires an authenticated `gh` CLI (`gh auth status` succeeds) and a connected Atlassian MCP server (the `mcp__atlassian__*` tools resolve). Without both, config resolution and every query below fail.

## Config Resolution

Read `~/.claude/standup.json` if present:

```bash
cat ~/.claude/standup.json 2>/dev/null
```

Fields: `jira.cloudId` (required), `github.org` (optional), `github.ignorePrs` (optional).

**Ignored PRs.** `github.ignorePrs` is an array of `"owner/repo#number"` strings — PRs the user has said to drop permanently (e.g. a long-open PR that shows up as `is:open` indefinitely but isn't real ongoing work). Filter every GitHub search result (Yesterday, Blockers — Today runs no GitHub search) against this list before using it, by matching `repo` (from the API's `repository_url`) plus `number`. This list only grows when the user explicitly says to ignore a PR going forward — append the new entry to the existing array in `~/.claude/standup.json` (merge, don't overwrite) and confirm to the user it's saved. Don't ask the user to re-confirm an ignore that's already in the list on future runs.

**Assignee filter.** Use `assignee = currentUser()` by default. If this Jira instance has a secondary-assignee user-picker field, discover its ID from the instance's field metadata (for example, via `getJiraIssueTypeMetaWithFields` for a relevant project and issue type). Then use `(assignee = currentUser() OR cf[<verified-field-id>] = currentUser())`. Do not reuse a custom-field ID from another instance. In every JQL example below, replace `<assignee_filter>` with the chosen expression before calling the tool.

Example file:

```json
{
  "jira": { "cloudId": "your-team.atlassian.net" },
  "github": { "org": "your-github-org", "ignorePrs": ["your-github-org/some-repo#123"] }
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

Drop any result matching an entry in `github.ignorePrs` before using the list.

Use `author:@me`, not `involves:@me`. GitHub's `involves` qualifier is a shorthand for author, assignee, mentions, *and* commenter — approving or commenting on someone else's PR counts as "commenter," so `involves:@me` surfaces PRs you reviewed as if they were PRs you worked on. `author:@me` restricts this to PRs you actually opened.

Use a single `updated:$window_start..$window_start` range qualifier, not two separate `updated:>=`/`updated:<` qualifiers. GitHub search ORs repeated occurrences of the same qualifier rather than ANDing them, so two `updated:` clauses match the union of both instead of the intersection and the date filter silently matches everything. A same-day `..` range already covers the whole day, so no second variable is needed on the GitHub side.

Append ` org:<github.org>` to the `q` value if `github.org` is configured and non-empty; omit it entirely otherwise.

**Verify before including.** GitHub's `updated:` qualifier reflects the PR's `updatedAt` timestamp, which can move for reasons unrelated to real work — a stale, already-merged PR can resurface with an `updatedAt` inside the window even though its last commit and comment are months or years old. Before writing a PR into the Yesterday section, fetch its actual activity and confirm at least one commit or comment timestamp falls inside `window_start`..`window_end`:

```bash
gh pr view <number> --repo <owner>/<repo> --json title,commits,comments --jq '{title, lastCommit: .commits[-1].committedDate, lastComment: .comments[-1].createdAt}'
```

If neither timestamp falls in the window, drop the PR from Yesterday — its `updatedAt` match was noise, not activity.

Jira JQL (via `searchJiraIssuesUsingJql`, substituting the actual computed dates for `<window_start>`/`<window_end>`):

```
<assignee_filter> AND issuetype != Epic AND updated >= "<window_start>" AND updated < "<window_end>" ORDER BY updated DESC
```

Excludes epics: epics assigned to the user don't represent work done, only a container the user happens to be assignee on. Only stories, tasks, and bugs count.

### Today

Jira JQL only — no GitHub search runs for Today. A PR sitting open isn't ongoing work by itself; if its ticket is In Progress in Jira, the ticket already surfaces it. Narrating open PRs separately restates the same work twice and drags in PRs that are just idling in review with nothing happening today.

```
<assignee_filter> AND issuetype != Epic AND statusCategory = "In Progress" ORDER BY updated DESC
```

Excludes epics for the same reason as the Yesterday query above.

Uses the status *category*, not a literal status name, since literal names vary by project (one project might use `In_Progress` with underscores, another "In Dev," another something else entirely). The category is standardized across every project in a Jira instance.

### Blockers

GitHub:

```bash
gh api --method GET search/issues -f q="is:pr author:@me is:open status:failure" --jq '[.items[] | {number, title, url: .html_url, repo: .repository_url}]'
```

Same org-suffix rule as above. Drop any result matching an entry in `github.ignorePrs` before using the list.

Jira JQL:

```
<assignee_filter> AND issuetype != Epic AND statusCategory != Done AND (flagged is not EMPTY OR status = "Blocked") ORDER BY updated DESC
```

Checks both the built-in Impediment flag and a literal `"Blocked"` workflow status, since Jira has no standardized "blocked" status category the way it does for To Do/In Progress/Done. Excludes epics for the same reason as the Yesterday query above.

**Per-clause graceful degradation:** if `flagged` isn't a valid field on this instance, or no status literally named `"Blocked"` exists, JQL errors on that specific clause. Drop only the failing clause and retry with the other:

Only the `flagged` clause:
```
<assignee_filter> AND issuetype != Epic AND statusCategory != Done AND flagged is not EMPTY ORDER BY updated DESC
```

Only the `status = "Blocked"` clause:
```
<assignee_filter> AND issuetype != Epic AND statusCategory != Done AND status = "Blocked" ORDER BY updated DESC
```

Only fall back to relying on the GitHub CI-failure signal alone if both clauses turn out invalid.

## Pre-finalize check

Assignee and secondary-assignee JQL plus authored-PR search still miss real work: pairing on a teammate's ticket, review-only involvement, or a ticket owned by someone else entirely. Before writing the final summary, run all the queries above, then show the user a brief recap of what was found in each section and ask one open question: whether anything is missing, or anything found should be dropped. Fold the answer into the three sections before printing the final summary — don't print a summary and then separately ask; the check happens first.

This is a single scoped confirmation against the automated findings, not a blank "what did you do" prompt — it's asked once per run, after digging, not instead of digging.

**Recap format.** The recap itself is prose, not bullets: a few concise sentences (roughly one per section), not bolded section headers with bullet lists underneath. Bullets read as a report; the user wants something as terse as the final Y:/T:/B: output, just with enough detail to sanity-check before finalizing. Keep it short — this is a confirmation step, not the deliverable.

## Output format

Three lines, one per section, labeled `Y:`, `T:`, `B:` — not full words, not bold headers, not bullets. Each line is one or two sentences, synthesized rather than listed item-by-item. If a section surfaces more than a couple of items, pick the highest-value ones instead of enumerating everything.

Write for a reader who doesn't have Jira open — a manager or teammate skimming the update should understand what was done without looking anything up. Describe the work in plain language only. Omit ticket keys and PR numbers entirely by default — the identifiers are still used internally to find and cross-check the work, they just don't appear in the printed output. Only include a ticket/PR identifier if the user explicitly asks for identifiers in a given run (e.g. "include ticket numbers this time"); that request applies to that run only, not future ones, unless the user says to make it the default.

Use the following fictional examples as the target format, framing, and length.

```
Y: Fixed the settings page save bug and added tests for validation errors.
T: Finishing the account preferences form.
B: The preview deployment is blocked by a failed build.
```

```
Y: Merged the search pagination fix and started the notification preferences API.
T: Finishing the API tests and checking the error responses.
B: None noted.
```

When blockers are found, describe the concrete reason (failing CI, flagged, or `Blocked` status) in plain language, without an identifier unless requested.

Printed in chat only — no posting to Slack or anywhere else, no file written beyond the config file above.

## Non-goals

- Entirely read-only: never transitions a Jira ticket, never comments on a PR or ticket, never posts anywhere.
- Does not ask the user to state a plan from a blank slate — the today section is still derived automatically from current in-progress Jira tickets; the pre-finalize check only confirms/fills gaps in what was already found.
- Does not attempt cross-timezone "yesterday" reasoning beyond the last-working-day rule — uses the local machine's date.
- Does not depend on the sdlc-jira-github plugin or any other plugin.
