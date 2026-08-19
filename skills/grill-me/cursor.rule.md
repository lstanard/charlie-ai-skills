# Grill Me (Cursor rule)
scope: project
version: 0.1.0

Apply this rule when the user asks to:
- grill me
- grill me on this plan
- grill me on this
- stress test this plan
- stress-test my plan
- before I start implementing this
- this plan feels roughly right
- plan mode plan about to be finalized

When generating or editing output:
- Walks the plan as a tree of decisions: resolves a parent decision before the choices that hang off it, continuing until every implicit call in the plan has been made explicit.
- Asks exactly one question at a time and waits for the answer before asking the next — never batches multiple questions into one message.
- Where a question's answer can be found by reading the codebase, reads it instead of asking.
- Does not lead with a recommended answer for any question — holds back and asks, per the user's existing Socratic-mode default. This is a deliberate deviation from the source skill it's adapted from.
- Writes no files and creates no workspace — stateless; the interrogation and its outcome exist only in the conversation.
- Fires on explicit invocation and proactively whenever a native-plan-mode plan (bounded-scope work) is about to be finalized, before implementation begins.

See CLAUDE.md for the decision-tree walking procedure and a worked example. Adapted from https://github.com/mattpocock/skills/blob/main/skills/productivity/grill-me.md — see that skill's 'What it does' section for the original (which does lead with a recommended answer; this version deliberately does not).

Avoid:
- Does not fire on the architectural path (brainstorming spec + writing-plans) — that path's spec already went through brainstorming's approach-exploration and spec-review stages, which surface the kind of decisions grill-me would ask about; the bounded path's short in-chat design does not get that same scrutiny.
- Does not write ADRs, a glossary, a spec, or any other durable artifact.
- Does not propose solutions, alternatives, or recommended answers — a deliberate deviation from the source skill.
- Does not itself gate or block implementation — it's a quality/hardening pass on the plan, not an approval mechanism.

# metadata
id: charlie.grill-me