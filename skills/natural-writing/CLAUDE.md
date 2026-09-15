# Natural Writing — Reference

## When to invoke

Two ways in:

- **Auto**: any time prose is about to be shown to someone other than the current user — a Jira ticket, a piece of documentation, a PR or commit description, a code comment, a Slack or chat message, a design doc. Check it before presenting it, the same way a spell-checker runs before you hit send.
- **Explicit**: the user asks to "humanize" a draft, rewrite it "like a human," or flags a specific word or phrase as sounding like AI ("no one talks like that," "sounds like ChatGPT," "too much jargon").

Does not apply to internal reasoning, code identifiers, file paths, or exact commands — only to prose meant to be read by a person.

## Step 1: Check outward-facing prose before presenting it

Read `avoid-list.md` in this skill directory. This is an overuse guardrail, not a banned-word list: a term on it is flagged because AI defaults to it far more than a person would, not because it's always wrong. For each flagged term or phrase present in the draft, judge it before swapping:

- Is it the reflexive, default-sounding choice here — the word that shows up because it's the AI-typical one, not because it's the sharpest fit? Swap it for the listed alternative.
- Is it genuinely the most accurate or natural word for this specific sentence, and would the listed alternative be a worse fit or lose precision? Leave it. One well-placed use of a flagged word is not the problem; falling back on it as a tic is.

Preserve technical meaning exactly either way — this is a vocabulary and register judgment call, not a content edit.

Beyond the list, apply judgment: the list is a seed and a growing memory, not the full boundary of what counts. If a word is the kind of thing a real colleague would never say out loud in a ticket or a Slack message — even if it's not yet in the list — rewrite it anyway. The test: would a specific coworker actually say this sentence to another coworker? If the answer is no because the words are stiff, inflated, or vague-but-official-sounding, rewrite it. If the answer is no only because the sentence is too casual for the context, leave it.

Do not flag or alter:
- Precise technical terms, API names, flags, config keys, or product/feature names — these have no natural substitute and swapping them would be wrong, not more natural.
- Domain jargon the audience uses daily (see the Define-at-first-use rule in the global Writing Style guidance for the separate concern of introducing unfamiliar terms).

## Step 2: Log feedback — the self-improving loop

This is the part that makes the skill durable. When the user says a word, phrase, or construction reads as AI-generated or unnatural, do this before moving on to anything else:

1. Identify the exact flagged term or phrase from what the user pointed at.
2. Determine the plain alternative. If the user supplied their own rewrite, use that. If they only flagged the problem without a rewrite, infer a plain alternative from context and use it in the current draft — don't stop to ask unless the intended meaning is genuinely ambiguous.
3. Append one row to the table in `avoid-list.md`: the flagged term, the plain alternative, and a one-line dated context (e.g. `2026-09-15 — flagged in a Jira ticket about a service integration; read as marketing copy, not an engineering description`).
4. Re-render the current draft using the new alternative and continue the task.

Never ask permission to log the entry — logging it is part of applying the feedback, not a separate action requiring sign-off. Do not batch multiple unrelated feedback instances into one row; one row per distinct flagged term or phrase.

This file is a real, git-tracked file in this skill's directory, not session memory — it persists across conversations and projects wherever this skill is installed. Edits to it are local like any other file edit; commit them only if the user asks to commit, per normal git-safety rules.

The globally installed copy at `~/.claude/skills/natural-writing/avoid-list.md` is a symlink back to this file in the `charlie-ai-skills` repo, not a separate copy. A feedback edit made while working in any project writes straight to the git-tracked source — no reinstall step needed to pick it up. This only holds on the machine where that symlink was created; a fresh machine setup needs it re-linked (or re-run the plain install, then manually replace the copied file with a symlink) — see `scripts/installSkills.js`'s `copyFileUnlessSymlinkedToSource` guard, which keeps a bulk reinstall from clobbering the symlink.

## Step 3: Periodic consolidation (optional, only if asked)

If the user asks to "clean up" or "consolidate" the avoid-list, look for near-duplicate rows (same term flagged more than once, or two rows that amount to the same underlying word-choice pattern) and merge them into a single row with the clearest alternative and context. Never do this unprompted — the log's raw history has value even when repetitive.

## Non-goals

- Sentence-level structure, em dashes, and prepositional compression are already handled by the global Writing Style rules in CLAUDE.md — this skill only covers word and phrase choice.
- Not a content editor: it never removes information, changes a technical claim, or shortens a draft for brevity. Compression is a separate concern from register.
- Not a documentation-structure tool — that's `docs-writing`.
- Not a banned-word list: never refuses or flags a single, well-placed, genuinely-apt use of a listed term just because it's on the list.
