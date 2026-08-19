# SDLC — Reference

## When to invoke

Invoked as `/sdlc [JIRA-KEY]`. If `JIRA-KEY` is omitted, derive it from the current branch name using the `JIRA-KEY-slug` convention (e.g. branch `POU-4497-my-feature` -> key `POU-4497`). If neither an argument nor a matching branch name is available, ask the user for the ticket key before proceeding.

Before calling any Atlassian MCP tool with object-type parameters (e.g. `getJiraIssue`'s `issueIdOrKey`), load it via `ToolSearch` first (e.g. `select:mcp__atlassian__getJiraIssue`) — without this, calls fail with cryptic type errors.

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
| `prTemplateUrl` | Fall back to the required-sections template in Phase 10 if no repo-local template exists either. |

**Precedence when `prTemplateUrl` is present:** a repo-local template (`.github/pull_request_template.md`, `.github/PULL_REQUEST_TEMPLATE/` directory) always takes priority over a configured `prTemplateUrl` — check for the repo-local template first, before ever consulting this field.

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
3. Before the first implementation step, ask the user explicitly: "Use subagent-driven-development (fresh subagent per task, review between tasks, in the current session) or executing-plans (a separate/parallel session with review checkpoints) to implement this plan?" Proceed using whichever the user picks.

**Bounded:**
1. Use native Claude Code plan mode to draft a plan. No plan document is produced — the subagent-driven-development/executing-plans choice above does not apply here.
2. Once the plan feels roughly right, invoke the `grill-me` skill before writing any code. Proceed to Phase 5 only once `grill-me`'s interrogation concludes.

## Phase 5: Implement

TDD throughout, regardless of path (`superpowers:test-driven-development`): write a failing test, confirm it fails, write the minimal implementation, confirm it passes, refactor if needed, commit at each meaningful checkpoint.

## Phase 6: Acceptance-criteria gate

1. Reuse the AC and DoD list captured in Phase 1.
2. Compare the accumulated diff (working branch vs. the default branch, including any uncommitted changes still in the working tree — not just what's been committed so far) against each AC/DoD item individually — met, partially met, or not met.
3. **This is a hard gate.** If any item is not fully met, stop here: report exactly which item(s) are unmet and why, and wait for the user to address them. Do not proceed to Phase 7 until every item is met.
4. Once every item is met, proceed.

## Phase 7: Code review

1. Run the built-in `code-review` workflow at `max` effort with `--fix`, against the current diff (branch vs. default branch).
2. Do not pass `--comment` — nothing gets posted to GitHub.
3. Findings that survive the workflow's own verification pass are fixed automatically by `--fix` — no per-finding user triage.
4. Re-run the affected tests after fixes are applied to confirm nothing broke.

## Phase 8: Size guard

1. `pr-size-guard` should already have fired proactively at plan-time and at mid-coding checkpoints per its own trigger conditions — this step is the final, explicit check before the commit/push/PR sequence.
2. It is advisory only, per its own contract: report the measured lines/files and threshold(s) exceeded, propose a split if over threshold, and ask the user whether to split now or continue as-is. Never block on this.
3. If the user chooses to split, that restructuring happens outside this pipeline — pause `sdlc` and resume once the user has a single right-sized change ready to continue with.

## Phase 9: Quiz

Invoke `quiz-me` on the work just completed, right before commit. This is a deliberate proactive invocation by `sdlc` — see that skill's own carve-out note for why this doesn't contradict its "never proactive" default. The quiz result is informational only; it does not gate Phase 10.

## Phase 10: Commit / Push / Open PR

Three separate prompts — never bundle them, since the user may want to stop after any one of them.

1. **Commit?** This covers whatever remains uncommitted after Phases 6–9 (e.g., code-review auto-fixes from Phase 7) — distinct from the TDD checkpoint commits Phase 5 has likely already made along the way. If yes: stage the specific files that changed (not `git add -A`), write a Conventional Commits message (`<type>[optional scope]: <description>`), commit. If no: stop here for this run — this does not mean nothing has been committed, only that nothing further will be committed in this run.
2. **Push?** If yes: `git push -u origin <branch-name>` (first push) or `git push` (subsequent pushes on this branch). If no: stop here.
3. **Open a PR?** If yes, continue below. If no: stop here.

**Creating the PR:**

a. Reuse the ticket data from Phase 1 (title, description, AC, DoD) to inform the PR description.
b. Check for a PR template, in priority order: repo-local (`.github/pull_request_template.md`, then `.github/PULL_REQUEST_TEMPLATE/` directory), then the config's `prTemplateUrl` (Config Resolution), then the required-sections template in (c) if neither exists.
c. **Required sections** (fill in even when using a template, adding any missing section):
   - **What changed** — a clear summary of what was built
   - **Jira ticket** — link to `https://<cloudId>/browse/<JIRA-KEY>`
   - **Where to start reviewing** — point the reviewer at the most important files/entry points
   - **Risks and assumptions** — decisions, trade-offs, or areas of uncertainty
   - **Definition of Done** — explicit confirmation that each DoD criterion is met
   - **Technical debt** — deferred work with `TODO` references, or "None"
   - **Attribution footer** — `---` then `_Posted with AI_` on its own line
d. Write the body to a uniquely-named temp file and reference it — never inline generated text directly in a shell command (backticks/quotes/`$()` in the content would be interpreted by the shell). Use `mktemp` rather than a fixed filename, since a fixed path like `/tmp/pr-body.md` risks collisions across concurrent runs and is never cleaned up:
   ```bash
   pr_body_file="$(mktemp -t pr-body)"
   cat <<'EOF' > "$pr_body_file"
   <completed PR body>
   EOF
   gh pr create \
     --title "<type>: <JIRA-KEY> <ticket-title>" \
     --body-file "$pr_body_file"
   rm -f "$pr_body_file"
   ```
e. **No Jira status transition.** **No Jira comment** unless the user separately and explicitly asks for one as its own action outside this pipeline.
f. Confirm creation with `gh pr view` and share the PR URL.

## Phase 11: CI loop

1. Resolve `ciWorkflow` per Config Resolution.
2. Before each watch cycle, capture the commit this run must correspond to: `git rev-parse HEAD`.
3. Find the latest run for this branch:
   ```bash
   gh run list --workflow="<ci-workflow-name>" --branch "<branch-name>" --limit 1 --json databaseId,status,conclusion,headSha
   ```
4. **Guard:** treat the run as "not found yet" in either of these cases — do not call `gh run watch`:
   - the list is empty or `databaseId` is null, or
   - a run was returned but its `headSha` does not match the `git rev-parse HEAD` value captured in step 2 (this means GitHub is still showing a previous run; it has not yet registered the new push).

   In either case, poll again: wait 10 seconds and re-run step 3, up to a total of 60 seconds. If no matching run has appeared after 60 seconds, report "No CI run found for branch `<branch-name>` matching commit `<sha>` — it may not have triggered yet" and stop.
5. Once a run with a matching `headSha` is found: `gh run watch <run-id> --exit-status` until it completes.
6. **On success:** report the result and proceed to Phase 12.
7. **On failure:**
   a. Fetch the failure detail: `gh run view <run-id> --log-failed`
   b. Classify each failing job:
      - **Fixable** — a failing test assertion, a lint/type error, a reproducible code bug: diagnose it, fix the code, re-run the affected tests locally to confirm, commit, push, then repeat from step 2 to watch the new run.
      - **Not fixable from this session** — infra/runner flakiness, missing secrets or permissions, an unavailable external service, a quota/rate limit: stop the loop here, report exactly which job/step failed and why it's outside what this session can resolve, and wait for the user.
   c. This loop is fully autonomous for fixable failures — no confirmation prompt before each fix-and-repush cycle — but never silently retries a non-fixable failure; it surfaces those immediately.
   d. **Termination bounds, checked before starting each new fix-and-repush cycle:**
      - **Repeat-failure check:** if the same job fails with substantially the same error as the previous cycle (same failing test/step, same error message or root cause), stop the loop and report it as unresolvable from this session — regardless of how it was originally classified in step 7b. A fix that didn't change the failure isn't going to change it by being retried.
      - **Hard cap:** after 3 fix-and-repush cycles, stop the loop and report to the user, even if remaining failures still look fixable in principle.
   e. Repeat until the run is green or the loop stops on a non-fixable failure, a repeat failure, or the 3-cycle cap.

## Phase 12: Stop

Once CI is green: report the PR URL and stop. Do not run `check-review`. Do not wait for human review or approval. Do not merge. Do not transition the Jira ticket. The user merges the PR and transitions the ticket themselves once it's approved.

Note the naming: `check-review` is the `sdlc-jira-github` plugin's unresolved-PR-review-comment fetcher — unrelated to the `code-review` workflow used in Phase 7.

## Non-goals

- No dependency on the `sdlc-jira-github` plugin.
- Never transitions Jira ticket status, at any phase.
- Never posts a Jira comment unless the user explicitly asks for one, as an action separate from this pipeline.
- Never posts a GitHub PR comment or review.
- Never merges a PR, and never waits for human review/approval before stopping.
- Does not run `check-review`.
- Does not implement `grill-me`'s interrogation logic itself — delegates to that standalone skill.
