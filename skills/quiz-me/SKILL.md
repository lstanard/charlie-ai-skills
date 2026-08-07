---
name: quiz-me
description: Run an interactive comprehension quiz on code the agent just produced or discussed (a PR, a diff, a feature) so the user can verify they understand it, not just that it works. Trigger this whenever the user says something like 'quiz me', 'quiz me on this', or 'test my understanding' — never run it proactively after finishing work. Asks a fixed number of questions one at a time across three difficulty tiers and four categories (mechanics, design rationale, operations, big picture), scores each answer, and ends with a per-category report.
---

# Quiz Me
version: 0.1.0

## Purpose
Run an interactive comprehension quiz on code the agent just produced or discussed (a PR, a diff, a feature) so the user can verify they understand it, not just that it works. Trigger this whenever the user says something like 'quiz me', 'quiz me on this', or 'test my understanding' — never run it proactively after finishing work. Asks a fixed number of questions one at a time across three difficulty tiers and four categories (mechanics, design rationale, operations, big picture), scores each answer, and ends with a per-category report.

## Triggers
- quiz me
- quiz me on this
- test my understanding
- quiz me on this PR
- check my understanding of this code

## Inputs
- target: string (optional) — PR number, file path, or diff to quiz on; defaults to the most recent code discussed in the conversation
- question_count: number (optional) — number of questions to ask; default 10

## Guarantees
- Defaults to quizzing on the most recent code or PR discussed in the current conversation; uses a user-specified target (file, PR, diff) instead when one is given.
- Asks exactly question_count questions (default 10), split roughly 3 easy / 4 medium / 3 hard, covering four categories — mechanics, design rationale, operations, big picture — each appearing at least once.
- Asks one question at a time and waits for the user's answer before asking the next.
- Accepts free-form answers of a sentence or two; does not require exact terminology.
- Scores each answer on a 0–2 scale with half-point granularity (0, 0.5, 1, 1.5, 2) per the rubric in CLAUDE.md, and gives brief feedback on what was right or missed before moving on.
- Does not volunteer hints; gives one only if the user asks, and the hint narrows the search rather than answering.
- After the last question, presents a final report: a total score and percentage, a table of score and qualitative read (Strong/Good/Weak) per category, and three short synthesis paragraphs — what the user clearly owns, the common pattern in what they missed, and why those gaps matter for the actual target work.

## Non-goals
- Does not gate PR merges, task completion, or any other action on the quiz score — informational only.
- Does not persist quiz results to disk or git.
- Does not trigger proactively after finishing work — only runs when explicitly asked.
- Does not adapt question count or difficulty to the size or complexity of the target work.

## Notes
See CLAUDE.md for the grading rubric, question-distribution guidance, and final report template.