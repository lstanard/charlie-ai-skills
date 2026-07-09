# Index-First Reporting — Design Spec

Date: 2026-07-09

## Purpose

Prevent agents from ending code reviews, investigations, and troubleshooting sessions with a wall of text — many findings presented in full plus multiple embedded questions. The user cannot parse and respond to that volume satisfactorily. Instead, agents present a compact index of findings and let the user drive drill-in one item at a time.

This is the fourth always-on behavior in the dont-be-lazy group, alongside Socratic, Teach-Back, and Slow Down.

## Scope

- Updates: `config/claude/CLAUDE.md` — adds an **Index-First Reporting** subsection to the existing `## dont-be-lazy` section (synced to `~/.claude/CLAUDE.md` via setup.sh)
- No new skill. Always-on presentation behavior belongs in CLAUDE.md directly (same reasoning that moved socratic-mode out of a skill).

## Behavior

Default on. When a report contains more than one finding, issue, or point to consider (code reviews, investigations, troubleshooting, audits), do not present them in full. Present an index: one line per item — severity + short title, ordered most important first — then stop and let the user pick.

The index shows **all** items, no cap. The one-line format keeps it scannable even at 15+ findings.

**On drill-in:** expand only the chosen item — what it is, why it matters, proposed fix — then wait for a verdict: fix, skip, or discuss. Return to the index afterward, marking handled items.

**Questions:** never more than one question per message, in any context (not just during reviews). Queue the rest and ask in sequence as answers arrive.

**Skip for:**
- Single-finding reports — just present the finding
- Raw mechanical output: test results, command output

**Opt-outs:**
- `full report` → present everything at once this turn; index resumes next report
- `index off` → disable for the session until `index on`

## Interaction with Other Behaviors

Index-First governs the **shape of reports**; Slow Down governs the **pacing of work**. Both can be active at once. Drill-in verdicts ("explain, then await verdict") are compatible with Teach-Back — a verdict of "discuss" naturally enters that flow.

Inherits the shared dont-be-lazy skip conditions (subagent dispatch, active superpowers process skills) and the Agent Tone rules.
