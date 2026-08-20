# Work Log — Reference

## When to invoke

- Explicit logging: "log that...", "add to my work log...", "log: <description>", `/work-log`.
- Explicit review: "show my work log for <period>", "what did I work on last month", "work log summary".
- Explicit backfill: "backfill my work log", "catch up my work log for the last two weeks".
- Proactive: not a phrase the user says — this doc's Proactive suggestions section applies whenever, during any conversation, a clearly-completed unit of work is detected.

**Prerequisites for backfill only:** requires an authenticated `gh` CLI (`gh auth status` succeeds) and a connected Atlassian MCP server (the `mcp__atlassian__*` tools resolve). Explicit logging and review need neither.

## Entry format

`~/.claude/worklog.jsonl` — append-only, one JSON object per line, oldest first:

```json
{"date": "2026-08-20", "description": "Fixed a bug where the settings page's save button didn't respond to clicks", "project": "reports-service", "links": ["PROJ-1234"]}
```

Fields:
- `date` — ISO 8601 (`YYYY-MM-DD`), the date the work was completed, not necessarily today.
- `description` — one or two sentences, plain language, high-level. Never file paths, function names, or line-level detail.
- `project` — repo/project name. See Project auto-detection below.
- `links` — array of strings, `[]` if none. Ticket keys and/or PR URLs.

**Project auto-detection** (explicit and proactive entries only — backfill is different, see below):

```bash
git remote get-url origin 2>/dev/null
```

Extract the path segment after the last `/`, minus a trailing `.git`. If that fails, use the current directory's basename. If that's unavailable too, use `"unknown"`.

**Append operation:**

```bash
mkdir -p ~/.claude
cat >> ~/.claude/worklog.jsonl <<'EOF'
{"date": "...", "description": "...", "project": "...", "links": []}
EOF
```

A quoted heredoc (`<<'EOF'`) does no shell interpolation or word-splitting, so it's safe for descriptions containing apostrophes or other shell-special characters. Before substituting values into the JSON line, JSON-escape the `description` value (escape `"` and `\`).

Never rewrite or reorder existing lines, except backfill's dedup step, which only ever adds new lines.

## Creating an entry

### Explicit

1. Distill what the user said into a one-or-two-sentence `description` in the plain-language style of the example above — not a verbatim copy of more granular or more terse phrasing.
2. Extract any ticket key or PR link mentioned (or already visible in this conversation, e.g. a PR just discussed); an entry with `links: []` is valid, so don't block on this.
3. Run project auto-detection.
4. Append and confirm briefly ("Logged.").

### Proactive suggestions

Ask once, at a clearly-completed unit of work, with a description already drafted from context: "Want me to log this to your work log?" Checkpoints that count:
- A PR merged, or `superpowers:finishing-a-development-branch` completed a merge/PR.
- An SDLC skill's final phase finished for a ticket.
- A Jira issue transitioned to a Done-category status.
- Any other exchange that clearly wrapped up a distinct piece of work — use judgment here; this isn't limited to the three checkpoints above.

On yes: append, pulling `links` from the same context (the PR just merged, the ticket just transitioned). On no: don't ask again for that same unit of work in this conversation. This is judgment-based guidance for the running conversation, not a mechanical trigger enforceable across sessions — a fresh session has no memory of what a prior session already asked about.

## Backfill

On-demand only. If the user doesn't state a range, ask for one — there's no sensible default the way "last working day" is for a daily standup.

**Config:** read `~/.claude/standup.json` for `jira.cloudId` and `github.org`. Do not create a second config file for these two values — this is the same file, same schema, and same path `standup-summary` uses, so a value collected by either skill is available to the other.

**First-run behavior**, if either field is absent:
1. Check `jira.cloudId` and `github.org` independently — a file that already has one field set still gets asked about the other if that one is missing, rather than skipping setup entirely just because the file exists.
2. If `jira.cloudId` is absent: no automatic discovery is possible — ask the user directly (e.g. "What's the Jira cloud ID? e.g. your-team.atlassian.net").
3. If `github.org` is absent: ask once whether to scope the GitHub search to a specific org. Leaving it blank means the search runs unscoped across every repo the user's `gh` token can see; store that choice as an explicit empty string (`"org": ""`), never a bare `org:` with nothing after it in a query, so it isn't asked again. A bare `org:` with nothing after it causes a 422 from GitHub's search API.
4. Write whichever answer(s) were just collected back to `~/.claude/standup.json`, merging into the file's existing contents rather than overwriting it wholesale — a field the user already configured must survive a run that only needed to ask about the other field. Create the file (and `~/.claude/` if somehow absent) if it doesn't exist yet.

**Resolve the range** to concrete start/end dates (e.g. "last two weeks" → `date -v-14d +%Y-%m-%d` through today; "this month" → the 1st of the current month through today). `date -v` is macOS/BSD syntax; Linux needs the GNU equivalent (e.g. `date -d '14 days ago' +%Y-%m-%d`).

**GitHub query** (`--method GET` is required — without it, `gh api` defaults to a POST body once any `-f` parameter is present, and the search endpoint 404s):

```bash
gh api --method GET search/issues -f q="is:pr author:@me is:merged merged:<range_start>..<range_end>" --jq '[.items[] | {number, title, url: .html_url, repo: .repository_url}]'
```

Append ` org:<github.org>` if configured and non-empty. Use `author:@me`, not `involves:@me` — `involves` also matches PRs merely commented on or approved, which would misattribute reviewed work as authored (the same misattribution bug `standup-summary` hit).

**Jira JQL** (via `searchJiraIssuesUsingJql`, loaded via `ToolSearch` first: `select:mcp__atlassian__searchJiraIssuesUsingJql`):

```
assignee = currentUser() AND statusCategory = Done AND resolved >= "<range_start>" AND resolved <= "<range_end>" ORDER BY resolved ASC
```

Known limitation: some workflows transition an issue to a Done-category status without ever setting a resolution date. Such tickets won't appear in this query, since it's keyed on `resolved`. No fallback is implemented for this case.

**Dedup:** if `~/.claude/worklog.jsonl` doesn't exist yet, treat it as having zero entries — not an error — and skip straight to drafting every result. The canonical stored form for a GitHub PR reference is the full PR URL (the `url` field from the `gh api` result above, which is `.html_url`), never a bare number like `#212`. Read every existing line in `~/.claude/worklog.jsonl` and collect every ticket key and PR URL already present in any `links` array. For an existing entry that instead stored a bare `#N` or `N` (from before this convention, or from a manual entry), normalize it against a candidate's full URL by matching the PR number plus the repo the candidate result came from. Drop any GitHub or Jira result whose identifier is already in that set (after normalization).

This dedup only works against entries that have `links`. An entry with `links: []` is valid and common for manually-logged work with no ticket or PR, but it carries nothing to match against, so it can never be caught by this method. At the batch-confirmation step below, tell the user that link-less entries aren't covered by automatic dedup, so they should watch for a candidate that duplicates something they already logged manually without a link.

**Drafting:** for each remaining result, draft a one-line `description` in the same plain-language style as manual entries (a PR titled "Bump sdk version to 4.7.0" becomes "Shipped SDK version 4.7.0," not the raw title). `date` is the merge/resolution date. `project` comes from the GitHub repo name or the Jira project key/name in the result itself — not from the current working directory, since backfill isn't necessarily run from the repo the work happened in.

**Confirmation:** show the whole drafted batch at once (date, description, links for each candidate) and get one confirmation covering the batch — approve all, drop specific ones, or edit a description before writing. Note when presenting the batch that entries with no `links` aren't covered by automatic dedup, so the batch may include something already logged manually without a link — ask the user to watch for that while reviewing. Only write approved entries. Never auto-write.

## Review

"Show my work log for <period>" — today, this week, this month, this year, or an explicit range. Resolve to a concrete date range using the local machine's date, then read `~/.claude/worklog.jsonl` and filter to entries whose `date` falls in range. If the file doesn't exist yet, treat it as having zero entries — not an error. If no entries fall in the resolved range, say so in plain language (e.g. "No entries logged for that period.") rather than surfacing a file-read error or an empty summary.

**Default:** a synthesized summary, grouped by project when more than one appears, in the plain-language style established for `standup-summary`'s output — lead with what was done, ticket/PR references trailing. Not exhaustive on a large range; pick the notable items.

**Raw list on request** ("just list the entries," "raw," "no summary"): print each matching entry, one per line, chronological: `<date> — <description> (<links>)`.

Example synthesized output:

```
**reports-service:** Shipped SDK version 4.7.0 to unblock a downstream data migration (https://github.com/your-org/reports-service/pull/198). Fixed a bug where the settings page's save button didn't respond to clicks (PROJ-1234).

**infra-tooling:** Migrated the CI pipeline off the deprecated runner image (PROJ-1301, https://github.com/your-org/infra-tooling/pull/212).
```

## Non-goals

- Does not edit or delete existing entries — append-only in this version. Correcting or removing a wrong or accidental entry means editing `~/.claude/worklog.jsonl` by hand; this skill provides no edit/delete operation.
- Does not write anything without a request — proactive suggestions and backfill both require confirmation before writing.
- Does not share code or stored data with standup-summary — only reads the same config file for jira.cloudId/github.org.
- Does not attempt cross-timezone date reasoning — uses the local machine's date.
- Does not capture file-level, commit-level, or line-level detail.
- Never posts anywhere, and never writes any file besides `~/.claude/worklog.jsonl` and, on first backfill run, `~/.claude/standup.json` — chat output only.
