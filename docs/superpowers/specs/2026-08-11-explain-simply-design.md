# Explain Simply — Design Spec

Date: 2026-08-11

## Purpose

Claude's explanations sometimes lean on dense or invented phrasing that's hard to parse, even with the plain-language rules already in the global CLAUDE.md. The user needs an explicit fallback: a way to signal "that explanation didn't land" and get the same content back in plain, concrete language, without having to spell out the request each time.

## Scope

New skill at `skills/explain-simply/`:
- `skill.json` — source of truth
- `SKILL.md`, `cursor.rule.md` — generated via `npm run gen`

No `CLAUDE.md` — the guarantees are short enough to live entirely in `skill.json`/`SKILL.md`; this is a static rule, not a multi-step interactive workflow.

Added to the general skills table in `README.md` per the `skill-maintenance` skill's convention.

## Trigger

`scope: global`, no tags. Applies across all projects, same as `general-coding-rules` — this is a communication-style preference, not project-specific.

Triggers on the literal phrase plus its self-deprecating variants, and on direct requests to simplify:
- "I'm a stupid baby", "I'm an idiot", "I'm dumb", "I'm stupid"
- "dumb it down", "ELI5", "explain like I'm five", "explain simpler", "I don't get it"

## Behavior

- Re-explains only the most recent explanation, not the whole conversation.
- Replaces jargon, dense compound phrases, and invented terminology with plain, everyday words.
- Preserves the actual content and technical accuracy of the original explanation — only the language changes, not the substance.
- Stays matter-of-fact per the Agent Tone rules in CLAUDE.md — no baby talk, no exaggerated simplicity, no reassurance filler ("no worries!", "great question!"). The trigger phrase is self-deprecating; the response does not mirror that tone.
- If a term is load-bearing (a specific API, flag, or config name), keeps the term but defines it in plain words instead of dropping it.

## Non-goals

- Does not shorten or omit content to fake simplicity — that's compression, not clarity.
- Does not proactively simplify explanations that weren't flagged as confusing.
- Does not dumb down exact identifiers, file paths, or commands — those stay literal.

## Relationship to existing CLAUDE.md rules

Complements the global Agent Tone and Writing Style rules, which already push toward plain language by default. This skill is the explicit fallback trigger for when a specific explanation still lands wrong.
