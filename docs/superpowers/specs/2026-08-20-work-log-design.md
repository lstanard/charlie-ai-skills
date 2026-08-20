# Work Log — Design Spec

Date: 2026-08-20

## Purpose

Weeks and months pass and the details of what you actually worked on get lost — Jira and GitHub have the record, but reconstructing it later means digging through both. This skill keeps a running, high-level log of completed work as it happens: a sentence or two per entry, not file-level detail, so a week/month/year retrospective is a quick read instead of an archaeology project.

## Scope

New skill at `skills/work-log/`:
- `skill.json` — source of truth
- `SKILL.md`, `cursor.rule.md` — generated via `npm run gen`
- `CLAUDE.md` — entry format, proactive-trigger guidance, backfill queries, review/query logic

Added to the general skills table in `README.md` per the `skill-maintenance` skill's convention.

`scope: global`, no tags. Runs from any directory — the log is one file across all your projects, not scoped to the current repo.

## Trigger

- Explicit logging: "log that...", "add to my work log...", "log: <description>", `/work-log`.
- Explicit review: "show my work log for <period>", "what did I work on last month", "work log summary".
- Explicit backfill: "backfill my work log", "catch up my work log for the last two weeks".
- Proactive suggestion (not a trigger you invoke, but a behavior the skill's guidance activates during any session): when a clearly-completed unit of work is detected — a PR merged or a branch finished via `superpowers:finishing-a-development-branch`, an SDLC skill's final phase completing, a Jira ticket transitioning to a Done-category status, or any other exchange that obviously wrapped up a distinct piece of work — the agent asks whether to log it. A decline is not re-asked for that same unit of work.

Backfill additionally requires an authenticated `gh` CLI and a connected Atlassian MCP server, the same prerequisite `standup-summary` documents.

## Approach

Direct inline read/append: the skill's `CLAUDE.md` documents the exact file format and query logic, run straight in the main conversation — no subagent dispatch, no wrapper scripts, consistent with `standup-summary`'s reasoning (small data, main-loop simplicity, wrapper scripts premature until a third Jira/GitHub-querying skill exists).

Fully independent from `standup-summary` in code and storage — no shared functions, no shared data file for entries. The one exception is config: backfill needs the same `jira.cloudId` and `github.org` values `standup-summary` already collects, and reusing that file avoids asking the user for the same values twice (see Config below).

## Config

Backfill reuses `standup-summary`'s config file at `~/.claude/standup.json` for `jira.cloudId` and `github.org` — same schema, same first-run behavior (ask independently per field, merge rather than overwrite) documented in that skill's `CLAUDE.md`. `work-log` does not introduce a second config file for the same two values. If a user has never run `standup-summary` and runs `work-log` backfill first, the same first-run questions fire and get written to `~/.claude/standup.json`.

`work-log` introduces no config fields of its own — the log file path (`~/.claude/worklog.jsonl`) is fixed, not configurable, matching the fixed-path precedent nothing in this repo currently deviates from.

## Data format

`~/.claude/worklog.jsonl` — append-only, one JSON object per line, oldest first:

```json
{"date": "2026-08-20", "description": "Fixed a bug where the settings page's save button didn't respond to clicks", "project": "reports-service", "links": ["PROJ-1234"]}
```

Fields:
- `date` — ISO 8601 date (`YYYY-MM-DD`) the work was completed, not necessarily the day the entry was written (a backfilled entry for last Tuesday gets last Tuesday's date).
- `description` — one or two sentences, plain language, high-level. Never file paths, function names, or line-level detail.
- `project` — the repository/project name, auto-detected (see below). `"unknown"` if detection fails (e.g., not inside a git repo).
- `links` — array of strings, optional, empty array if none. Ticket keys (`PROJ-1234`) and/or PR URLs, whichever apply. Never required for an entry to be valid.

**Project auto-detection:** run `git remote get-url origin` in the current working directory; extract the repo name from the URL (the path segment after the last `/`, minus a trailing `.git`). If that fails (no remote, not a git repo), fall back to the current directory's basename. If that's also unavailable, use `"unknown"`.

**Append operation:** read the existing file (empty string if absent), append the new JSON line, write back — or simply open in append mode and write one line, creating the file (and `~/.claude/` if somehow absent) if it doesn't exist. Never rewrite or reorder existing lines except during backfill dedup (which only ever adds lines, never edits existing ones — see below).

## Entry creation

### Explicit

The user states or implies what was completed ("log that I shipped a client library upgrade so the reports pipeline can pull data from the new API"). The agent:
1. Distills this into a one-or-two-sentence `description` in the same plain-language style as the example above — not a verbatim copy of whatever phrasing the user used, if that phrasing was more granular or more terse than the target style.
2. Extracts any ticket key or PR link the user mentioned, or asks if none were mentioned and one seems likely to exist (a PR the user just discussed in this conversation, for instance) — but doesn't block on the user answering; an entry with an empty `links` array is valid.
3. Runs project auto-detection.
4. Appends the entry and confirms briefly (e.g., "Logged.").

### Proactive

At a detected checkpoint — PR merged or `finishing-a-development-branch` completed, an SDLC skill's final phase completed, a Jira issue transitioned to a Done-category status, or another exchange that clearly wrapped up a distinct piece of work — the agent asks once: "Want me to log this to your work log?" with a proposed one-line `description` already drafted from the conversation's context. On a yes, append (with links pulled from the same context, e.g. the PR just merged or the ticket just transitioned). On a no, don't ask again for that same unit of work in this conversation.

This is guidance for judgment, not a mechanical trigger the skill can enforce outside the conversation it runs in — a fresh session has no memory of what it already asked about in a prior session's completed work.

## Backfill

On-demand only ("backfill my work log", "catch up my work log for the last two weeks"). If no period is stated, ask what range to cover — there's no sensible default the way `standup-summary`'s "last working day" is a sensible default for a daily standup.

**Queries**, using the resolved date range and the `jira.cloudId`/`github.org` from `~/.claude/standup.json`:

- GitHub: `gh api --method GET search/issues -f q="is:pr author:@me is:merged merged:<range_start>..<range_end>"` (+ `org:<github.org>` if configured and non-empty) — `author:@me`, not `involves:@me`, for the same reason `standup-summary`'s `CLAUDE.md` documents: `involves` also matches PRs merely commented on or approved, which would misattribute reviewed work as authored work (the exact misattribution bug that surfaced in `standup-summary`'s first real use).
- Jira JQL: `assignee = currentUser() AND statusCategory = Done AND resolved >= "<range_start>" AND resolved <= "<range_end>" ORDER BY resolved ASC`. The upper bound is inclusive (`<=`), matching GitHub's `merged:<range_start>..<range_end>`, which is inclusive of both ends — an exclusive upper bound would silently drop tickets resolved on the last day of the range. Known limitation: some workflows transition an issue to a Done-category status without ever setting a resolution date. Such tickets won't appear in this query, since it's keyed on `resolved`. No fallback is implemented for this case.

**Dedup:** the canonical stored form for a GitHub PR reference is the full PR URL (`.html_url` from the `gh api` result), never a bare number like `#212`. Before drafting anything, read `~/.claude/worklog.jsonl` and collect every ticket key and PR URL already present across all `links` arrays. For an existing entry that stored a bare `#N` or `N` instead, normalize it against a candidate's full URL by matching the PR number plus the repo the candidate result came from. Drop any GitHub or Jira result whose identifier already appears there (after normalization).

This method can't dedup entries with `links: []` — a valid, common shape for manually-logged work with no ticket or PR — since there's nothing in them to match against. The batch-confirmation step must tell the user that link-less entries aren't covered by automatic dedup, so they can watch for a backfill candidate that duplicates something already logged manually without a link.

**Drafting:** for each remaining result, draft a one-line `description` in the same plain-language style as manual entries (e.g., a PR titled "Bump sdk version to 4.7.0" becomes "Shipped SDK version 4.7.0", not a restatement of the raw title), the resolved/merged date as `date`, auto-detected... — **exception:** `project` for a backfilled entry comes from the GitHub repo name or the Jira project key/name in the result itself, not from the current working directory, since backfill isn't necessarily run from the repo the work happened in.

**Confirmation:** present the full drafted batch at once — every candidate entry with its date, description, and link — and ask for one confirmation covering the batch (approve all, drop specific ones, or edit a description before it's written). Note when presenting the batch that entries with no `links` aren't covered by automatic dedup, so the batch may include something already logged manually without a link — ask the user to watch for that while reviewing. Only write the approved entries. Never auto-write, matching the caution already established for Jira/GitHub-derived attribution.

## Review

"Show my work log for <period>" (today, this week, this month, this year, or an explicit date range). Resolve the period to a concrete date range (calendar week/month/year, using the local machine's date, or the literal range given), then read `~/.claude/worklog.jsonl` and filter to entries whose `date` falls in range.

**Default output:** a synthesized summary, grouped by project when entries span more than one, written in the same plain-language style established for `standup-summary`'s output — lead with what was done, not with ticket IDs. Not exhaustive if the range is large; pick the notable items.

**Raw output:** if the user asks for the raw list specifically ("just list the entries," "raw," "no summary"), print each entry in the range, one line each, chronological, in a plain `<date> — <description> (<links>)` format instead of synthesizing.

Example synthesized output for a monthly review:

```
**reports-service:** Shipped SDK version 4.7.0 to unblock a downstream data migration (https://github.com/your-org/reports-service/pull/198). Fixed a bug where the settings page's save button didn't respond to clicks (PROJ-1234).

**infra-tooling:** Migrated the CI pipeline off the deprecated runner image (PROJ-1301, https://github.com/your-org/infra-tooling/pull/212).
```

## Non-goals

- Not a replacement for `standup-summary` and not read by it — no shared code, no shared data file.
- No editing or deleting existing entries through this skill. Append-only for v1; revisit if this turns out to matter in practice.
- No automatic, unattended derivation from Jira/GitHub — backfill only runs on explicit request and only writes entries the user approves.
- Does not attempt cross-timezone date reasoning — uses the local machine's date, same as `standup-summary`.
- Does not post the log or any summary anywhere — chat output only, file storage only.
