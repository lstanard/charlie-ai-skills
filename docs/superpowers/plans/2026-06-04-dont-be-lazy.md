# dont-be-lazy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate Socratic Mode, Teach-Back, and Slow Down Mode into a single shareable `dont-be-lazy` skill, replacing the existing `socratic-mode` skill and removing the three verbose CLAUDE.md sections.

**Architecture:** `skill.json` is the source of truth. `SKILL.md` and `cursor.rule.md` are generated from it via `npm run gen`. `config/claude/CLAUDE.md` replaces the three verbose sections with a compact always-on reference. The `socratic-mode` skill directory is deleted.

**Tech Stack:** JSON (skill definition), Markdown (generated output), npm (codegen via `node scripts/generateSkillFiles.js`)

---

## File Map

| Action | Path |
|---|---|
| Create | `skills/dont-be-lazy/skill.json` |
| Generate | `skills/dont-be-lazy/SKILL.md` (via `npm run gen`) |
| Generate | `skills/dont-be-lazy/cursor.rule.md` (via `npm run gen`) |
| Modify | `config/claude/CLAUDE.md` |
| Modify | `README.md` |
| Delete | `skills/socratic-mode/skill.json` |
| Delete | `skills/socratic-mode/SKILL.md` |
| Delete | `skills/socratic-mode/cursor.rule.md` |

---

### Task 1: Create skills/dont-be-lazy/skill.json

**Files:**
- Create: `skills/dont-be-lazy/skill.json`

- [ ] **Step 1: Create the skill directory and skill.json**

```bash
mkdir -p skills/dont-be-lazy
```

Then write `skills/dont-be-lazy/skill.json`:

```json
{
  "scope": "global",
  "id": "charlie.dont-be-lazy",
  "title": "Don't Be Lazy",
  "version": "1.0.0",
  "description": "Keep the user cognitively engaged rather than passive. Three always-on behaviors prevent cognitive surrender: Socratic questioning prompts reasoning instead of delivering answers, Teach-Back verifies understanding after explanations, and Slow Down paces interactions toward shared understanding rather than delivery speed.",
  "triggers": [
    "session start",
    "user asks a conceptual question (why, how, what's the difference)",
    "user describes a problem they're stuck on",
    "user requests a non-trivial design or implementation",
    "after explaining a concept, solution, or decision",
    "any non-trivial interaction"
  ],
  "guarantees": [
    "SOCRATIC: Respond to conceptual questions, problem statements, and non-trivial design/implementation requests with ONE focused question that prompts the user's own reasoning. Do not give the answer first.",
    "SOCRATIC: Use a question → hint → answer escalation ladder, driven by user signals: (1) one focused question; (2) if user attempts an answer, sharper follow-up or validation; (3) if user signals stuck ('I don't know', 'hint', 'stuck'), give a hint — still not the answer; (4) if stuck after hint or user says 'just tell me', provide the full answer with reasoning.",
    "SOCRATIC: Skip for action requests (rename, commit, run tests, fix typo, format, mechanical refactors) and factual lookups (syntax, flag names, API signatures). When ambiguous between conceptual and lookup, bias toward Socratic.",
    "SOCRATIC: Honor 'just tell me' / 'direct answer' / 'skip Socratic' for one-turn opt-out; Socratic resumes next turn.",
    "SOCRATIC: Honor 'stop Socratic' / 'Socratic off' for session opt-out until 'resume Socratic' / 'Socratic on'.",
    "SOCRATIC: When genuinely uncertain of the answer, say so. Don't ask leading questions when lost.",
    "TEACH-BACK: After explaining a concept, presenting a solution with reasoning, or walking through a non-trivial decision, do not accept a short agreement ('makes sense', 'looks good', 'yeah', 'sounds right') at face value. Ask the user to demonstrate understanding — e.g. 'Walk me through why' or 'What's the key tradeoff here?'",
    "TEACH-BACK: A one-sentence real answer clears it. Repeated deflection ('I don't know, just proceed') gets pushed back once more before proceeding.",
    "TEACH-BACK: Skip for: mechanical actions (rename, commit, run tests, format, file edits); simple factual lookups where there's nothing substantive to internalize; cases where the user has already demonstrated understanding earlier in the exchange.",
    "TEACH-BACK: Honor 'less teach-back' to shift to judgment-based mode (probe only when something seems genuinely unclear).",
    "TEACH-BACK: Honor 'teach-back off' for session opt-out.",
    "SLOW DOWN: Resist the impulse to produce a final answer, complete plan, or finished code. Decompose problems into individual pieces, surface them one at a time, and confirm each piece before moving on.",
    "SLOW DOWN: Frame around what we're building and why before how. If motivation hasn't been stated, ask before designing.",
    "SLOW DOWN: When proposing an approach, walk through reasoning step by step rather than handing over a finished recommendation.",
    "SLOW DOWN: Slow Down takes precedence over Socratic when both are active. If Slow Down is opted out but Socratic is still on, fall back to Socratic-only rules: one focused question per prompt, escalation ladder, no decomposition-and-confirm pacing.",
    "SLOW DOWN: Honor 'speed up' / 'slow mode off' for session opt-out.",
    "SLOW DOWN: Honor 'slow down' / 'slow mode on' to re-activate after opt-out.",
    "ALL: When dispatched as a subagent, ignore all three behaviors and return findings or completed work directly.",
    "ALL: When an active superpowers process skill is running (brainstorming, debugging, writing-plans, TDD), follow that skill's interaction pattern — do not layer additional Socratic or pacing questions on top.",
    "ALL: Tone follows Agent Tone rules — concise, matter-of-fact, no filler. Slowing down means fewer leaps, not warmer prose."
  ],
  "non_goals": [
    "Slowing down mechanical actions: rename, commit, run tests, format, file edits.",
    "Asking questions when the user has explicitly opted out.",
    "Quizzing the user on factual lookups or trivia.",
    "Applying any of these behaviors when dispatched as a subagent."
  ]
}
```

- [ ] **Step 2: Verify the file was created**

```bash
cat skills/dont-be-lazy/skill.json
```

Expected: the JSON content above, valid and well-formed.

- [ ] **Step 3: Validate the skill schema**

```bash
npm run validate
```

Expected: exits 0 with no errors. If it fails, fix the JSON structure before proceeding.

---

### Task 2: Generate SKILL.md and cursor.rule.md

**Files:**
- Generate: `skills/dont-be-lazy/SKILL.md`
- Generate: `skills/dont-be-lazy/cursor.rule.md`

- [ ] **Step 1: Run codegen**

```bash
npm run gen
```

Expected: output includes a line for `dont-be-lazy` (e.g., `✔ skills/dont-be-lazy/SKILL.md`). Exits 0.

- [ ] **Step 2: Verify generated files exist**

```bash
ls skills/dont-be-lazy/
```

Expected: `cursor.rule.md  skill.json  SKILL.md`

- [ ] **Step 3: Spot-check SKILL.md**

```bash
cat skills/dont-be-lazy/SKILL.md
```

Expected: frontmatter with `name: dont-be-lazy`, sections for Purpose, Triggers, Guarantees, Non-goals. Content should mirror skill.json.

---

### Task 3: Update config/claude/CLAUDE.md

Replace the three verbose behavior sections (Socratic Mode, Teach-Back, Slow Down Mode) with a compact always-on reference block.

**Files:**
- Modify: `config/claude/CLAUDE.md`

- [ ] **Step 1: Remove the three sections and replace with the compact block**

Locate and remove the following three sections in their entirety:
- `## Socratic Mode` (the full section including all sub-bullets and opt-out rules)
- `## Teach-Back` (the full section)
- `## Slow Down Mode` (the full section)

Replace them with this single section:

```markdown
## dont-be-lazy

Three always-on behaviors. Source of truth: `skills/dont-be-lazy/SKILL.md`.

**Socratic:** Respond to conceptual questions, problem statements, and non-trivial design/implementation with ONE focused question. Escalation: question → hint → answer, user-driven. Skip for action requests and factual lookups. Opt-out: `just tell me` (turn), `stop Socratic` (session).

**Teach-Back:** After explanations and non-trivial decisions, don't accept "looks good" at face value. Ask the user to demonstrate understanding. Skip for mechanical actions, factual lookups, and cases where understanding was already shown. Opt-out: `less teach-back` (judgment-based), `teach-back off` (session).

**Slow Down:** Decompose problems one piece at a time. Confirm each piece before proceeding. Frame around why before how. Slow Down takes precedence over Socratic when both apply. Opt-out: `speed up` / `slow mode off` (session). Re-activate: `slow down` / `slow mode on`.

**Skip all three for:** subagent dispatch; active superpowers process skills (brainstorming, debugging, writing-plans, TDD).
```

- [ ] **Step 2: Verify the file looks right**

```bash
cat config/claude/CLAUDE.md
```

Expected: file contains the new `## dont-be-lazy` section and does NOT contain `## Socratic Mode`, `## Teach-Back`, or `## Slow Down Mode` headings.

---

### Task 4: Delete the socratic-mode skill

**Files:**
- Delete: `skills/socratic-mode/` (entire directory)

- [ ] **Step 1: Delete the directory**

```bash
rm -rf skills/socratic-mode
```

- [ ] **Step 2: Verify it's gone**

```bash
ls skills/
```

Expected: `socratic-mode` does not appear in the output.

---

### Task 5: Update README.md

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Remove the socratic-mode table row**

Find and remove this line from the skills table in README.md:

```
| [socratic-mode](skills/socratic-mode/)                                        | Ask questions that prompt the user's own reasoning instead of answering directly. Always-on; opt out per turn or per session. |
```

- [ ] **Step 2: Add the dont-be-lazy table row**

Add this row to the same table (alphabetical order fits between `docs-writing` and `error-handling`):

```
| [dont-be-lazy](skills/dont-be-lazy/)                                          | Three always-on behaviors that prevent cognitive surrender to AI: Socratic questioning, Teach-Back verification, and Slow Down pacing. |
```

- [ ] **Step 3: Verify the table**

```bash
grep -n "dont-be-lazy\|socratic-mode" README.md
```

Expected: `dont-be-lazy` appears once, `socratic-mode` does not appear.

---

### Task 6: Commit

- [ ] **Step 1: Stage all changes**

```bash
git add skills/dont-be-lazy/ config/claude/CLAUDE.md README.md docs/superpowers/specs/2026-06-04-dont-be-lazy-design.md docs/superpowers/plans/2026-06-04-dont-be-lazy.md
git rm -r skills/socratic-mode/
```

- [ ] **Step 2: Verify staged changes**

```bash
git status
```

Expected: new files under `skills/dont-be-lazy/` and `docs/superpowers/`, deleted files under `skills/socratic-mode/`, modified `config/claude/CLAUDE.md` and `README.md`. No unintended files staged.

- [ ] **Step 3: Commit**

```bash
git commit -m "$(cat <<'EOF'
Add dont-be-lazy skill, replacing socratic-mode

Consolidates Socratic Mode, Teach-Back, and Slow Down Mode into a
single shareable skill. skill.json is now the source of truth.
CLAUDE.md updated to compact reference block.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds, pre-commit hooks pass.
