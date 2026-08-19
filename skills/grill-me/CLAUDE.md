# Grill Me — Reference

## When to invoke

- **Explicit:** the user says "grill me," "grill me on this plan," "stress test this plan," or similar.
- **Proactive:** a plan has just been drafted for bounded-scope work (see the `brainstorming` skill's three-way classification) and feels roughly right, but hasn't been implemented yet. Plan mode is typically how bounded-path work gets planned in practice, so this is usually a native Claude Code plan-mode plan. Invoke before the first implementation step, not after.
- **Do not invoke** on the architectural path (a plan produced by `brainstorming` → spec → `writing-plans`). That path's spec already went through `brainstorming`'s approach-exploration and spec-review stages, which surface the kind of decisions this skill would ask about; the bounded path's short in-chat design does not get that same scrutiny.

## Core procedure

### 1. Determine the target

If the user names a target (a specific plan file, or a specific plan-mode plan), interrogate that. Otherwise, default to the most recent plan drafted in the current conversation.

### 2. Find the decision tree in the plan

Read the plan (or the plan-mode plan text) and identify the decisions embedded in it — not just the steps, but the choices behind them: what to build first, which library/pattern to use, how a boundary is drawn, what happens on an edge case, what gets deferred. Some of these are stated; many are implicit — a step was written a certain way because a decision was made without being surfaced.

Arrange these as a tree: some decisions are prerequisites for others (e.g., "which state management approach" is a parent of "where does loading state live"). A decision with no unresolved parent is a root; a decision that only matters once its parent is settled is a child.

### 3. Walk the tree, root to leaf

Resolve a parent decision before asking about the choices that hang off it — there's no point asking about error-handling granularity in a module whose existence itself is still an open question.

For each decision node:

- If the answer is discoverable by reading the codebase (an existing pattern, an established convention, a library already in use), go read it — don't ask the user something the code already answers.
- Otherwise, ask the user. Exactly one question, then wait.

### 4. Ask without proposing an answer

Every question is a genuine open question — not a lead-in to the agent's own preferred answer. Do not append a suggested answer, a "I'd lean toward X" aside, or a false-choice framing that steers toward one option. This is the one deliberate divergence from the source skill this is adapted from: state the decision and the live options (if there are a small, known set) or just the open question (if the space is genuinely unbounded), and stop there.

Example — source skill's style (do NOT do this):
> "Should retries use exponential backoff? I'd recommend backoff with a 30s cap — want me to go with that?"

This skill's style (do this instead):
> "Should retries use exponential backoff?"

### 5. Keep walking until the tree is exhausted

Continue node by node — parent, then its children, then the next root — until there is no remaining decision in the plan that hasn't been either resolved by reading the code or answered by the user. The session ends when every branch has been visited, not after a fixed number of questions.

If the user says to stop or move on, stop immediately and note which branches are still open — this skill has no authority to hold up implementation.

### 6. No artifacts

Do not write a file, a doc, or a summary to disk. The plan itself (already written, wherever the plan-mode step put it) is the only durable artifact — this skill only sharpens the shared understanding of it in conversation. If the plan document needs updating based on what surfaced, that's a normal edit to the plan, not an output of this skill.

## Worked example

Plan-mode plan: "Add a `/export` endpoint that dumps a user's data as JSON."

Decision tree, walked root to leaf:

1. **Root — scope of "data":** "When you say 'a user's data,' does that mean just their own account record, or does it include data they've created that references other users (e.g., shared documents)?"
2. **Child of 1 — access control:** *(Read the codebase first — check whether there's an existing auth-middleware pattern for user-scoped endpoints.)* If one exists, apply it without asking. If not: "Who besides the user themselves should be able to call this — admins, support tooling, no one else?"
3. **Child of 1 — failure mode:** "If scope includes other users' data, a single account's export can get large. Should this endpoint stream the response, paginate it, or is a single synchronous JSON response acceptable for now?" This depends on item 1's answer, since including cross-user data is what makes payloads large enough for this to matter.
4. **Root — format guarantees:** "Should the JSON shape be considered a stable, versioned export format going forward, or is this a one-off debugging tool with no compatibility guarantee?" This does not depend on how scope was answered, so it's a second root rather than a child.

Each answer either resolves a leaf outright or opens a new child question — the walk continues until no open branch remains.

## Non-goals

- Does not run on the architectural path.
- Does not propose answers, alternatives, or defaults — only asks.
- Does not persist anything to disk.
- Does not have a fixed question count — it ends when the tree is exhausted, not on a schedule.
- Does not itself gate or block implementation — it's a quality/hardening pass on the plan, not an approval mechanism.
