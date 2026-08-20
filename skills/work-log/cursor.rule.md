# Work Log (Cursor rule)
scope: project
version: 0.1.0

Apply this rule when the user asks to:
- log that
- add to my work log
- show my work log
- work log summary
- what did i work on this
- backfill my work log
- /work-log

When generating or editing output:
- Appends entries to ~/.claude/worklog.jsonl (append-only, one JSON object per line: date, description, project, links) — never edits or deletes existing lines outside backfill's dedup check, which only ever adds lines.
- Creates an entry either on explicit request ("log that...") or proactively when a clearly-completed unit of work is detected (a PR merged, superpowers:finishing-a-development-branch completing, an SDLC skill's final phase finishing, a Jira ticket transitioning to a Done-category status, or another exchange that clearly wrapped up distinct work) — proactive suggestions always ask before writing, and a decline is not re-asked for that same unit of work.
- Auto-detects the project field from the current directory's git remote (falling back to the directory basename, then "unknown") for explicit and proactive entries; backfilled entries use the GitHub repo or Jira project from the matched result instead.
- Description is always one or two sentences in plain language — never file paths, function names, or line-level detail.
- Backfill (on-demand only) reuses standup-summary's ~/.claude/standup.json config (jira.cloudId, github.org) and queries GitHub for author:@me PRs merged in the requested range and Jira for currentUser() issues with statusCategory = Done resolved in the range — author:@me, not involves:@me, to avoid misattributing reviewed-but-not-authored work.
- Backfill drops any result whose ticket key or PR link already appears in the log, drafts one-line descriptions for the rest, and only writes the entries approved in one batch confirmation — never auto-writes.
- Reviewing a period (today/this week/this month/this year/an explicit range) returns a synthesized, plain-language summary grouped by project by default, or the raw chronological entry list when explicitly requested.
- Fully independent from standup-summary in code and stored data — the only shared element is reading the same config file for jira.cloudId/github.org.
- Chat-only output and file storage: never posts anywhere, never writes any file besides ~/.claude/worklog.jsonl and (on first backfill run) ~/.claude/standup.json.

See CLAUDE.md for the entry schema, project auto-detection logic, proactive-trigger guidance, backfill query strings and dedup logic, and the review/output format.

Avoid:
- Does not edit or delete existing log entries — append-only in this version.
- Does not automatically derive or write entries without a request — proactive suggestions and backfill both require confirmation before writing.
- Does not share code or stored data with standup-summary; reads its config file only for jira.cloudId/github.org.
- Does not attempt cross-timezone date reasoning — uses the local machine's date.
- Does not capture file-level, commit-level, or line-level detail in an entry's description.

# metadata
id: charlie.work-log