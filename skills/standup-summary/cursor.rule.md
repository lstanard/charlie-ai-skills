# Standup Summary (Cursor rule)
scope: project
version: 0.1.0

Apply this rule when the user asks to:
- generate my standup
- daily standup
- standup message
- standup update
- what did i work on yesterday
- /standup-summary

When generating or editing output:
- Reads ~/.claude/standup.json for jira.cloudId (required) and github.org (optional); jira.cloudId and github.org are each checked and asked for independently (no auto-discovery is possible for either field), and any newly-collected answer is merged into the existing file rather than overwriting it, so each field is asked at most once.
- Computes the time window as the last working day: Monday looks back to the prior Friday, Sunday looks back to the prior Friday, and any other day looks back one calendar day.
- Yesterday section: GitHub search 'is:pr author:@me updated:<window_start>..<window_start>' — author:@me rather than involves:@me, since involves also matches PRs merely commented on or approved, misrepresenting review activity as authored work; a single same-day range qualifier, since GitHub search ORs repeated occurrences of the same qualifier rather than ANDing them — (+ org filter if configured, omitted entirely when unset) and Jira JQL 'assignee = currentUser() AND updated >= "<window_start>" AND updated < "<window_end>"'.
- Today section: GitHub search 'is:pr author:@me is:open' (+ org filter if configured, omitted entirely when unset) and Jira JQL 'assignee = currentUser() AND statusCategory = "In Progress"' — using the status category rather than a literal status name, since literal names vary by project.
- Blockers section: GitHub search 'is:pr author:@me is:open status:failure' (+ org filter if configured, omitted entirely when unset) and Jira JQL checking both the flagged field and a literal 'Blocked' status; if either JQL clause errors because the field/status doesn't exist on this instance, drops only that clause and keeps the other, falling back to the GitHub signal alone only if both are invalid.
- Produces three labeled sections (Yesterday/Today/Blockers), one or two sentences each, synthesized rather than listing every item found — picks the highest-value points when a section surfaces more than a couple of items.
- Leads each bullet with a plain-language description of the work, readable by someone without Jira access; ticket/PR identifiers are a trailing reference, never the subject a bullet opens with.
- Chat-only output: never posts to Slack or anywhere else, never writes a file beyond the config file above.
- Entirely read-only: never transitions a Jira ticket, never comments on a PR or ticket.

See CLAUDE.md for the exact gh/JQL query strings, the time-window computation, the config file schema and first-run setup flow, and the output format template.

Avoid:
- Does not ask the user to manually state what they're working on — the today section is derived entirely from current in-progress Jira tickets and open authored PRs.
- Does not post the generated message anywhere — chat output only.
- Does not transition Jira ticket status or comment on tickets/PRs.
- Does not depend on the sdlc-jira-github plugin or any other plugin.
- Does not attempt cross-timezone "yesterday" reasoning beyond the last-working-day rule — uses the local machine's date.

# metadata
id: charlie.standup-summary