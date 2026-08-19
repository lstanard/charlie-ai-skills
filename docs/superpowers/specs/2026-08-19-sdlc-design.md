# Personal SDLC + Grill Me — Design Spec

Date: 2026-08-19

## Purpose

The org's `sdlc-jira-github` plugin handles Jira/GitHub mechanics well in places (`create-story-branch`, `create-pr`, `check-review`), but its full lifecycle — paired with the `sdlc-workflow` methodology plugin — doesn't match how the user actually wants to work: it transitions Jira ticket status, posts PR comments (`ai-review`), and waits on human merge approval. The user wants one personal skill that owns the full ticket-to-green-CI lifecycle on their own terms — using `pr-size-guard`, `quiz-me`, and a `max`-effort multiagent code review at the right points, asking before any commit/push/PR action, and never touching Jira status or posting to GitHub — with **no dependency on `sdlc-jira-github`**, since the user intends to remove that plugin eventually.

A second, smaller gap surfaced during design: the bounded/plan-mode path has no equivalent to `brainstorming`'s one-question-at-a-time interrogation before implementation starts. `grill-me` (adapted from [mattpocock/skills](https://github.com/mattpocock/skills/blob/main/skills/productivity/grill-me.md)) fills that gap and is useful generally, so it's a standalone skill rather than logic embedded in `sdlc`.

## Scope

Two new skills, both following this repo's `skill.json` → `SKILL.md`/`cursor.rule.md` convention:

- `skills/sdlc/` — `scope: project`, no tags. `CLAUDE.md` for the Jira/GitHub tool mechanics (Atlassian MCP calls, `gh` invocations, config file resolution) — same pattern as `pr-size-guard`.
- `skills/grill-me/` — `scope: global`, no tags. Ships with a `CLAUDE.md` after all — `SKILL.md` is fully generated from `skill.json`'s fields and can't hold the multi-step decision-tree procedure and worked example; `CLAUDE.md` carries those.

Both added to `README.md`'s skills table per `skill-maintenance`.

## Skill 1: `sdlc`

Invoked as `/sdlc [JIRA-KEY]`. If `JIRA-KEY` is omitted, derive it from the current branch name (`JIRA-KEY-slug` convention); if neither is available, ask.

**No dependency on the `sdlc-jira-github` plugin.** Talks to the Atlassian MCP and `gh` CLI directly. Reads `.claude/jira-github.json` / `.claude/jira-github.local.json` for cloud ID, default branch, CI workflow name, and PR template URL *if present* (they're just data files, not the plugin) — falls back to discovery (`gh repo view --json defaultBranchRef`, asking for the Jira cloud ID) when absent.

### Phase 1 — Fetch ticket (read-only)

- `mcp__atlassian__getJiraIssue` with the resolved cloud ID and ticket key.
- Present title, description, acceptance criteria, Definition of Done, dependencies, status, assignee.
- Flag explicitly if AC or DoD is missing or vague — do not attempt to fill gaps.
- No writes. No status transition, no comment.

### Phase 2 — Ticket walkthrough

- Ask the user to explain the work in their own words and propose a direction if they have one, before the agent proposes anything.
- Check the explanation against the ticket's actual requirements/AC. If it reveals a misunderstanding (missed AC item, wrong scope assumption), correct it on the spot and work through it together before proceeding.
- Challenge or build on any direction the user proposes, per the existing always-on Socratic/Slow Down behaviors — this phase doesn't suspend those, it's the moment they apply.

### Phase 3 — Branch

- Sync the default branch (`git checkout <default>`, `git pull origin <default>`).
- Derive `JIRA-KEY-short-slug` from the ticket title (lowercase, hyphenated, 3-5 words).
- Present the proposed name, confirm, then `git checkout -b <name>`.

### Phase 4 — Plan

- Classify bounded vs. architectural (existing `brainstorming` logic).
- **Architectural:** `brainstorming` → design doc → `writing-plans` produces a plan document. Before implementation starts, ask the user explicitly: subagent-driven-development (independent tasks, current session) or executing-plans (review checkpoints, separate session)?
- **Bounded:** native plan mode. No plan document exists, so the subagent-driven-development/executing-plans choice doesn't apply. Instead, once the plan feels roughly right, run `grill-me` (Skill 2) before implementation starts.

### Phase 5 — Implement

- TDD throughout, regardless of path.

### Phase 6 — Acceptance-criteria gate

- Compare the diff against the ticket's AC and DoD from Phase 1.
- **Hard gate.** A gap stops the pipeline — report what's unmet and wait for the user to address it before continuing. Not advisory.

### Phase 7 — Code review

- Built-in `code-review` workflow at `max` effort.
- Auto-apply fixes for findings that survive verification (`--fix` behavior) — no per-finding triage.
- Never pass `--comment`. Nothing gets posted to GitHub.

### Phase 8 — Size guard

- `pr-size-guard` — its own trigger conditions already fire it proactively during implementation (plan-time and mid-coding checkpoints); this phase is the final on-demand check before commit.
- Advisory only, per `pr-size-guard`'s own contract: reports the numbers, proposes a split, the user decides whether to act on it. Does not block.

### Phase 9 — Quiz

- `quiz-me`, right before commit. Full teach-back comprehension check on the work just built.
- Invoking it here is a deliberate exception to `quiz-me`'s own "never proactive" non-goal — the user is explicitly asking for it at the pipeline level, not the agent volunteering it after arbitrary work. `quiz-me`'s `skill.json`/`CLAUDE.md` should get a one-line carve-out noting `sdlc` invokes it deliberately at this gate.

### Phase 10 — Commit / Push / Open PR

- Three separate prompts. Never bundled — the user may want to commit locally without pushing or opening a PR yet.
- **Commit:** ask, then commit if yes.
- **Push:** ask, then `git push -u origin <branch>` if yes.
- **Open PR:** ask, then create the PR:
  - Check for a repo PR template (`.github/pull_request_template.md`, `.github/PULL_REQUEST_TEMPLATE/`), else the config's `prTemplateUrl`, else the required sections below.
  - Body covers: what changed, Jira ticket link (`https://<cloudId>/browse/<JIRA-KEY>`), where to start reviewing, risks/assumptions, explicit DoD-met confirmation, tech debt (or "None"), attribution footer (`---` then `_Posted with AI_`).
  - Title: `<type>: <JIRA-KEY> <ticket-title>` (conventional-commit format, Jira key after the type).
  - No Jira status transition. No Jira comment unless the user separately and explicitly asks for one.

### Phase 11 — CI loop

- `gh run list --workflow=<name> --branch=<branch> --limit 1` to find the run; guard against no run existing (report and stop rather than calling `gh run watch` on nothing).
- `gh run watch <run-id>` to completion.
- **On failure:** fully autonomous — diagnose the failure, fix what's fixable, push, and re-watch, repeating until green. Distinguish fixable failures (test assertions, lint, type errors, code-level bugs) from ones it can't resolve on its own (infra/flaky CI, missing secrets, permissions, environment issues) — flag the latter to the user rather than looping on them.
- No per-cycle confirmation prompts during this loop.

### Phase 12 — Stop

- Does not wait for human review, does not run `check-review`, does not merge, does not transition the Jira ticket. The user merges and transitions manually once approved.

## Skill 2: `grill-me`

Invoked as `/grill-me`, and also proactively by `sdlc` Phase 4 on the bounded path, and generally whenever plan mode is used in any session (not sdlc-specific) — this is a deliberate deviation from the source skill, which is purely user-invoked.

- Walks the plan as a decision tree: a parent decision resolved before the choices that hang off it, until every implicit call is made explicit.
- One question at a time. Where a question can be answered by reading the codebase, read rather than ask.
- **Deviation from the source skill:** does not lead with a recommended answer. The source skill proposes an answer for the user to react to; this version holds back and just asks, consistent with the user's existing Socratic-mode default (don't give the answer first).
- Stateless — writes no files, leaves no workspace. The only artifact is the sharpened understanding in the conversation.
- Does **not** fire on the architectural path — `brainstorming` already provides equivalent one-question-at-a-time interrogation there, so a second pass would be redundant.

## Non-goals (both skills)

- No Jira status transitions, ever.
- No unsolicited Jira comments — only if the user explicitly asks, as a separate action outside this pipeline.
- No GitHub PR comments or reviews posted.
- No merging, no waiting on human review/approval.
- `sdlc` has no dependency on the `sdlc-jira-github` plugin.
- `grill-me` does not run on the architectural path.

## Open follow-up

`quiz-me`'s `skill.json` and `CLAUDE.md` currently state it "does not trigger proactively... only runs when explicitly asked." `sdlc` invoking it automatically at Phase 9 needs a small carve-out added to that skill's non-goals/notes so the two skills' documented contracts don't contradict each other. Small edit, tracked separately from this spec's implementation plan.
