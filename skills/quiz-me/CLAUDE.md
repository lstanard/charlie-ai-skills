# Quiz Me — Reference

## When to invoke

Only when the user explicitly asks — phrases like "quiz me", "quiz me on this", "test my understanding". Never offer or start this unprompted after finishing a PR or task; that's the job of the always-on Teach-Back behavior, not this skill.

**Exception:** the `sdlc` skill invokes this deliberately at its Phase 9, right before commit. That invocation is not the agent volunteering a quiz unprompted — it's a pipeline step the user already opted into by running `/sdlc`. Treat it the same as an explicit ask: run the full quiz per the procedure below.

---

## Execution steps

### 1. Determine the target

If the user names a target (a PR number, a file, a diff), quiz on that. Otherwise, default to the most recent code or PR discussed in the current conversation — read back through what was just built or explained, not the whole repo.

### 2. Build the question set

Review the target and draft `question_count` questions (default 10) that satisfy two constraints at once: a tier per question, and a category per question.

**Tiers** (roughly 3 easy / 4 medium / 3 hard for the default 10; scale proportionally for other counts):
- **Easy** — can be answered by reading the code once
- **Medium** — requires connecting two or more parts of the change, or knowing why a common alternative wasn't used
- **Hard** — requires reasoning about consequences: what breaks, what this enables later, what tradeoff was accepted

**Categories** (each must appear at least once across the quiz):
- **Mechanics** — what the code literally does, step by step
- **Design rationale** — why this approach, over the alternatives
- **Operations** — runtime behavior, failure modes, configuration, what happens when it breaks
- **Big picture** — how this change serves the goal it was built for

Bias the pairing: easy questions skew mechanics, hard questions skew rationale/operations/big picture. A medium question is a reasonable place for any category.

Example question per category, for a hypothetical retry-queue change:
- Mechanics (easy): "What does this code do when a job fails twice in a row?"
- Design rationale (medium): "Why does this retry with exponential backoff instead of a fixed delay?"
- Operations (hard): "If the queue backend is unreachable for 10 minutes, what happens to jobs submitted during that window?"
- Big picture (hard): "How does this retry logic change what callers can assume about job delivery?"

### 3. Ask one question at a time

Present question 1. Wait for the user's answer before asking question 2. Don't batch questions, and don't preview upcoming questions.

Answers are free-form — a sentence or two is enough. Don't penalize imprecise terminology if the underlying understanding is correct.

### 4. Score each answer

Score on a 0–2 scale with half-point granularity against this rubric:

| Score | Meaning |
|---|---|
| 0 | Wrong, or "I don't know" |
| 0.5 | Mostly wrong, but gestures at something relevant |
| 1 | Right direction but missing a key detail (names the right area but not the actual mechanism/reason) |
| 1.5 | Mostly correct — missing only a minor detail or a precise phrasing, not the substance |
| 2 | Correct — names the actual mechanism or reason, not just the topic |

Give brief feedback (1–2 sentences: what was right, what was missed) immediately after scoring, then move to the next question.

### 5. Hints only on request

Don't volunteer hints. If the user asks for one, give a hint that narrows the search (e.g., point at the right file or concept) without stating the answer.

### 6. Final report

After the last question, present a report with three parts: a total score line, a category table, and three synthesis paragraphs.

```
Final report: 11.5 / 20 (58%)

| Area | Questions | Score | Read |
|---|---|---|---|
| Mechanics | Q1, Q2, Q3, Q7 | 5 / 8 | Strong |
| Design rationale | Q4, Q6, Q10 | 4 / 6 | Good |
| Operations | Q5, Q9 | 1 / 4 | Weak |
| Big picture | Q8 | 1.5 / 2 | Strong |

**What you clearly own:** [1–2 sentences naming the specific concepts the user nailed across categories — not "you did well" but the actual mechanisms/reasons they got right.]

**The pattern in what you missed:** [1–2 sentences naming the common thread across the misses and partials — not a repeat of each item, but what they have in common. Missed points often cluster around one underlying gap (e.g., "every dropped point lives one level deeper, in how things fail") rather than being unrelated.]

**Why that matters here specifically:** [1–2 sentences connecting the gaps to a concrete consequence for the actual target work — what could break, what decision it affects — plus a specific, short suggestion for what to re-read.]
```

- **Score**: category total out of that category's max (2 × number of questions in that category). The header total is out of `2 × question_count`.
- **Questions**: list the question numbers that landed in that category, so the user can trace a weak score back to the specific question.
- **Read**: a qualitative call (Strong/Good/Weak), not a fixed percentage cutoff — weigh how central the missed concept was to the target work, not just the score ratio. Two categories at the same percentage can get different reads if one miss was on a minor detail and the other was on a core mechanism.
- The synthesis paragraphs are the actual point of the report — the table is a scorecard, but the paragraphs are what tell the user what to do next. Keep them specific to the target work's actual files/concepts, not generic.
