# Explain Simply (Cursor rule)
scope: project
version: 0.1.0

Apply this rule when the user asks to:
- I'm a stupid baby
- I'm an idiot
- I'm dumb
- I'm stupid
- dumb it down
- ELI5
- explain like I'm five
- explain simpler
- I don't get it

When generating or editing output:
- On trigger, re-explains only the most recent explanation, not the whole conversation, using plain, everyday words in place of jargon, dense compound phrases, or invented terminology.
- Preserves the actual content and technical accuracy of the original explanation; only the language changes, not the substance.
- Response stays matter-of-fact per the Agent Tone rules in CLAUDE.md — no baby talk, no exaggerated simplicity, no apologizing or reassurance filler ('no worries!', 'great question!').
- If a term is load-bearing (a specific API, flag, or concept name), keeps the term but defines it in plain words rather than dropping it.

Complements the global Agent Tone and Writing Style rules in CLAUDE.md, which already push toward plain language by default; this skill is the explicit fallback trigger for when a specific explanation still lands wrong.

Avoid:
- Does not shorten or omit content to make an explanation seem simpler — that's compression, not clarity.
- Does not proactively simplify explanations that weren't flagged as confusing.
- Does not change the level of technical depth for code identifiers, file paths, or exact commands.

# metadata
id: charlie.explain-simply