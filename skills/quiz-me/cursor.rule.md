# Quiz Me (Cursor rule)
scope: project
version: 0.1.0

Apply this rule when the user asks to:
- quiz me
- quiz me on this
- test my understanding
- quiz me on this PR
- check my understanding of this code

When generating or editing output:
- Defaults to quizzing on the most recent code or PR discussed in the current conversation; uses a user-specified target (file, PR, diff) instead when one is given.
- Asks exactly question_count questions (default 10), split roughly 3 easy / 4 medium / 3 hard, covering four categories — mechanics, design rationale, operations, big picture — each appearing at least once.
- Asks one question at a time and waits for the user's answer before asking the next.
- Accepts free-form answers of a sentence or two; does not require exact terminology.
- Scores each answer on a 0–2 scale with half-point granularity (0, 0.5, 1, 1.5, 2) per the rubric in CLAUDE.md, and gives brief feedback on what was right or missed before moving on.
- Does not volunteer hints; gives one only if the user asks, and the hint narrows the search rather than answering.
- After the last question, presents a final report: a total score and percentage, a table of score and qualitative read (Strong/Good/Weak) per category, and three short synthesis paragraphs — what the user clearly owns, the common pattern in what they missed, and why those gaps matter for the actual target work.

See CLAUDE.md for the grading rubric, question-distribution guidance, and final report template.

Avoid:
- Does not gate PR merges, task completion, or any other action on the quiz score — informational only.
- Does not persist quiz results to disk or git.
- Does not trigger proactively after finishing work on its own initiative — only runs when explicitly asked, or when deliberately invoked by the sdlc skill's Phase 9 (right before commit), which is a pipeline-level user request rather than the agent volunteering it.
- Does not adapt question count or difficulty to the size or complexity of the target work.

# metadata
id: charlie.quiz-me