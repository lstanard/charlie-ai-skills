# Quiz Me — Design Spec

Date: 2026-08-07

## Purpose

After an agent produces a PR or finishes a task, the user has no lightweight way to confirm they actually understand what the code does and why. The always-on Teach-Back behavior in CLAUDE.md covers this shallowly (a one-sentence check after an explanation), but there's no explicit, deeper self-check the user can request on demand. This skill gives them one: a structured quiz, scored, with a final report broken down by category.

## Scope

New skill at `skills/quiz-me/`:
- `skill.json` — source of truth
- `SKILL.md`, `cursor.rule.md` — generated via `npm run gen`
- `CLAUDE.md` — execution steps, grading rubric, and question-generation guidance (same pattern as `frontend-performance-audit`, since this is a multi-turn interactive workflow rather than a static rule)

Added to the general skills table in `README.md` per the `skill-maintenance` skill's convention.

## Trigger and scope of quizzing

- `scope: global`, no tags. Applies to any codebase, not just this repo.
- Triggers only on explicit phrases: "quiz me", "quiz me on this", "test my understanding". Never fires proactively after finishing work — this is a deliberate contrast with `frontend-performance-audit`, which does trigger automatically.
- Default target: the most recent code or PR discussed in the current conversation. If the user names something else (a file, a PR number, a diff), that overrides the default.

## Question generation

- 10 questions by default, configurable via an optional `question_count` input.
- Three difficulty tiers: easy, medium, hard, split roughly 3/4/3 across the 10 questions.
- Four categories, each represented at least once across the quiz:
  - **Mechanics** — what the code literally does
  - **Design rationale** — why this approach was chosen
  - **Operations** — runtime behavior, failure modes, configuration
  - **Big picture** — how this change fits the broader goal or system
- Easy questions skew toward mechanics. Hard questions skew toward design rationale, operations, and big picture.

## Interaction flow

- One question at a time. Wait for the user's answer before asking the next question.
- Answers are free-form; a sentence or two is sufficient. Do not require exact terminology.
- Score each answer 0 (miss) / 1 (partial) / 2 (solid):
  - **0** — wrong, or "I don't know"
  - **1** — right direction but missing a key detail
  - **2** — correct and names the actual mechanism or reason
- After scoring, give brief feedback (what was hit or missed) before presenting the next question.
- No unsolicited hints. If the user asks for a hint, give one that narrows the search without revealing the answer.

## Final report

After the last question, present a report broken down by the four categories:
- Score per category (out of that category's max possible)
- A brief note on weak spots per category
- Total score out of 2 × question_count (20 by default)

## Non-goals

- Does not gate merging or mark work "incomplete" based on the score — informational only.
- Does not persist quiz results to disk or git — ephemeral, in-conversation only.
- Does not proactively offer itself after finishing work (explicit trigger only).
- Does not adapt question difficulty or count based on the size/complexity of the target work — fixed defaults, overridable via `question_count`.
