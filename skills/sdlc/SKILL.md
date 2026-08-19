---
name: sdlc
description: Owns the full lifecycle from a Jira ticket to a green CI run on an open PR. Invoked as '/sdlc [JIRA-KEY]' — derives the key from the current branch name if omitted. Talks to the Atlassian MCP and gh CLI directly; has no dependency on the sdlc-jira-github plugin. Fetches the ticket read-only, has the user explain the work and propose direction before the agent does (correcting misunderstandings on the spot), creates a JIRA-KEY-slug branch, plans (brainstorming+writing-plans for architectural work, native plan mode plus the grill-me skill for bounded work), implements with TDD, hard-gates on an acceptance-criteria check against the ticket, runs a max-effort multiagent code review that auto-fixes findings without posting PR comments, checks pr-size-guard as a final advisory gate, runs quiz-me as a teach-back check right before commit, asks separately whether to commit/push/open a PR, and then autonomously watches CI — fixing what it can and flagging what it can't — until the run is green. Stops there: no merge, no waiting on human review, no Jira status transition, no unsolicited Jira comment.
---

# SDLC
version: 0.1.0

## Purpose
Owns the full lifecycle from a Jira ticket to a green CI run on an open PR. Invoked as '/sdlc [JIRA-KEY]' — derives the key from the current branch name if omitted. Talks to the Atlassian MCP and gh CLI directly; has no dependency on the sdlc-jira-github plugin. Fetches the ticket read-only, has the user explain the work and propose direction before the agent does (correcting misunderstandings on the spot), creates a JIRA-KEY-slug branch, plans (brainstorming+writing-plans for architectural work, native plan mode plus the grill-me skill for bounded work), implements with TDD, hard-gates on an acceptance-criteria check against the ticket, runs a max-effort multiagent code review that auto-fixes findings without posting PR comments, checks pr-size-guard as a final advisory gate, runs quiz-me as a teach-back check right before commit, asks separately whether to commit/push/open a PR, and then autonomously watches CI — fixing what it can and flagging what it can't — until the run is green. Stops there: no merge, no waiting on human review, no Jira status transition, no unsolicited Jira comment.

## Triggers
- /sdlc
- sdlc <JIRA-KEY>
- start work on <JIRA-KEY>
- work this jira ticket
- pick up this ticket
- run the full lifecycle for this ticket

## Inputs
- jira_key: string (optional) — the Jira ticket key (e.g. POU-1234). If omitted, derived from the current branch name using the JIRA-KEY-slug convention; if neither is available, the user is asked for it.

## Guarantees
- Phase 1 (fetch ticket): read-only mcp__atlassian__getJiraIssue call; presents title, description, acceptance criteria, Definition of Done, dependencies, status, assignee; flags missing/vague AC or DoD without filling gaps; no writes.
- Phase 2 (ticket walkthrough): the user explains the work and any proposed direction before the agent proposes anything; the agent checks this against the ticket and corrects misunderstandings on the spot, and challenges/builds on the proposed direction per existing Socratic/Slow Down defaults.
- Phase 3 (branch): syncs the default branch, derives a JIRA-KEY-short-slug name from the ticket title, confirms with the user, then creates the branch.
- Phase 4 (plan): architectural work goes through brainstorming -> design doc -> writing-plans, then asks the user whether to execute via subagent-driven-development or executing-plans; bounded work uses native plan mode, then invokes the grill-me skill before implementation starts.
- Phase 5 (implement): TDD throughout, regardless of path.
- Phase 6 (acceptance-criteria gate): compares the diff against the ticket's AC/DoD; this is a hard gate — any gap stops the pipeline until the user addresses it.
- Phase 7 (code review): runs the built-in code-review workflow at max effort, auto-applies fixes for findings that survive verification, and never passes --comment.
- Phase 8 (size guard): pr-size-guard fires proactively during implementation per its own trigger conditions, and again here as a final check; advisory only, reports and proposes a split, never blocks.
- Phase 9 (quiz): invokes quiz-me as a teach-back comprehension check right before commit — a deliberate proactive invocation at this specific gate.
- Phase 10 (commit/push/open PR): three separate prompts, never bundled; PR body covers what changed, Jira link, where to review, risks/assumptions, explicit DoD-met confirmation, tech debt, and an attribution footer; PR title is '<type>: <JIRA-KEY> <ticket-title>'; no Jira status transition or comment.
- Phase 11 (CI loop): watches the CI run to completion; on failure, autonomously diagnoses and fixes fixable failures and re-pushes, repeating until green, while flagging failures it can't resolve (infra, permissions, flaky runners) instead of looping on them.
- Phase 12 (stop): reports the PR URL and stops — no check-review, no waiting on human review/approval, no merge, no Jira status transition.

## Non-goals
- No dependency on the sdlc-jira-github plugin — talks to the Atlassian MCP and gh CLI directly.
- Never transitions Jira ticket status.
- Never posts a Jira comment unless the user explicitly asks for one as a separate action outside this pipeline.
- Never posts a GitHub PR comment or review.
- Never merges a PR and never waits for human review/approval before stopping.
- Does not run check-review.
- Does not implement the grill-me interrogation itself — delegates to the standalone grill-me skill.

## Notes
See CLAUDE.md for the exact Atlassian MCP/gh CLI mechanics, config file resolution and fallback, PR body template, and the CI failure-classification procedure.