# SDLC — Reference

## When to invoke

Invoked as `/sdlc [JIRA-KEY]`. If `JIRA-KEY` is omitted, derive it from the current branch name using the `JIRA-KEY-slug` convention (e.g. branch `POU-4497-my-feature` -> key `POU-4497`). If neither an argument nor a matching branch name is available, ask the user for the ticket key before proceeding.

Before calling any Atlassian MCP tool with object-type parameters (e.g. `getJiraIssue`'s `issueIdOrKey`, `transitionJiraIssue`'s `transition`), load it via `ToolSearch` first (e.g. `select:mcp__atlassian__getJiraIssue`) — without this, calls fail with cryptic type errors.

## Config Resolution

Read, in order, if present:

```bash
cat .claude/jira-github.json 2>/dev/null       # team config, committed
cat .claude/jira-github.local.json 2>/dev/null # personal overrides, gitignored
```

Fields used from `integrations.jira`: `cloudId`. Fields used from `integrations.github`: `defaultBranch`, `ciWorkflow`, `prTemplateUrl`. Where both files set the same field, the personal (`.local.json`) value wins.

**Fallback when a field is absent:**

| Field | Fallback |
|---|---|
| `cloudId` | No automatic discovery is possible — ask the user directly (e.g. "What's the Jira cloud ID for this project? e.g. guild-education.atlassian.net"). |
| `defaultBranch` | `gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'` |
| `ciWorkflow` | `gh workflow list` — identify the primary CI workflow from the listed names; if more than one plausibly fits, ask the user which to watch. |
| `prTemplateUrl` | Check for a repo-local template first (`.github/pull_request_template.md`, `.github/PULL_REQUEST_TEMPLATE/` directory) before ever consulting this field — a repo template always takes priority over a configured URL. If neither exists, fall back to the required-sections template in Phase 10. |

## Phase 1: Fetch ticket (read-only)

1. Resolve `cloudId` per Config Resolution.
2. Call `mcp__atlassian__getJiraIssue` with `cloudId` and `issueIdOrKey: <JIRA-KEY>`.
3. Present, structured:
   - **Title** — the ticket summary
   - **Description** — full description text
   - **Acceptance Criteria** — extracted from the ticket (description or a dedicated field)
   - **Definition of Done** — extracted from the ticket (dedicated field or section)
   - **Dependencies** — linked tickets or blockers
   - **Status** — current ticket status
   - **Assignee** — current assignee, if any
4. If acceptance criteria are missing or vague, or Definition of Done is absent, flag this explicitly — do not attempt to fill the gap yourself.
5. No writes of any kind in this phase — no status transition, no comment.

## Phase 2: Ticket walkthrough

1. Ask the user to explain the work in their own words, and to propose a direction if they have one — before the agent proposes anything itself.
2. Compare the user's explanation against the ticket's actual description, AC, and DoD from Phase 1.
3. If the explanation reveals a misunderstanding (a missed AC item, a wrong assumption about scope, a misread requirement), correct it on the spot and work through the discrepancy together — do not silently note it and move on.
4. If the user proposed a direction, engage with it under the existing always-on Socratic/Slow Down behaviors: challenge assumptions, ask the one question that matters, or build on it — rather than deferring to it uncritically or replacing it wholesale with the agent's own idea.
5. Do not proceed to Phase 3 until the user's understanding of the ticket is accurate and any proposed direction has been discussed.

## Phase 3: Branch

1. Resolve `defaultBranch` per Config Resolution.
2. Sync it:
   ```bash
   git checkout <default-branch>
   git pull origin <default-branch>
   ```
3. Derive a slug from the ticket title: lowercase, hyphen-separated, 3–5 words, no special characters (e.g. "Implement bulk delete endpoint for admin API" -> `bulk-delete-endpoint`).
4. Branch name: `<JIRA-KEY>-<slug>` (e.g. `POU-4497-bulk-delete-endpoint`).
5. Present the proposed name to the user and confirm before creating it.
6. `git checkout -b <branch-name>`

## Phase 4: Plan

Classify the work using the `brainstorming` skill's spike/bounded/architectural split (a Jira ticket is virtually always bounded or architectural; if it turns out to be a pure feasibility spike, follow `brainstorming`'s spike path for the investigation itself, then re-classify the resulting implementation work as bounded or architectural before continuing this pipeline).

**Architectural:**
1. Run `brainstorming` through to an approved design, written to a spec document, per that skill's own process.
2. Run `writing-plans` to produce a plan document.
3. Before the first implementation step, ask the user explicitly: "Use subagent-driven-development (fresh subagent per task, review between tasks) or executing-plans (batch execution with checkpoints, this session) to implement this plan?" Proceed using whichever the user picks.

**Bounded:**
1. Use native Claude Code plan mode to draft a plan. No plan document is produced — the subagent-driven-development/executing-plans choice above does not apply here.
2. Once the plan feels roughly right, invoke the `grill-me` skill before writing any code. Proceed to Phase 5 only once `grill-me`'s interrogation concludes.
