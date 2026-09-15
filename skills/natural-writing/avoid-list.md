# Natural Writing — Avoid List

Living list of words and phrases that read as AI-generated or corporate jargon rather than something a colleague would actually say. Checked before presenting any prose written for other people (tickets, docs, PR/commit descriptions, code comments, chat messages). Grows via direct feedback — see `CLAUDE.md` in this directory for the logging procedure.

**This is an overuse guardrail, not a banned-word list.** Every term here is flagged because AI reaches for it far more than a person would, not because the word is always wrong. A single, well-placed use where it's genuinely the most accurate or natural fit is fine — the problem is falling back on it as a reflexive default. See the judgment call in `CLAUDE.md` Step 1.

The "Context" column on seed rows just says why the term is a tell. On feedback rows it records the date and where it came up, per the logging procedure.

## Word-level

| Flagged term | Plain alternative | Context |
|---|---|---|
| leverage (as a verb) | use | inflated synonym for "use" |
| utilize | use | inflated synonym for "use" |
| robust | solid, reliable, well-tested | vague intensifier, says nothing concrete |
| seamless / seamlessly | (describe what actually happens) | vague intensifier |
| comprehensive | (name what's actually covered) | vague intensifier |
| holistic | (describe the actual scope) | vague, no concrete meaning |
| streamline | simplify, cut steps from | vague intensifier |
| facilitate | help, let, make it possible to | inflated synonym |
| foster | encourage, help build | inflated synonym |
| elevate | improve, raise | inflated synonym |
| empower | let, give (someone) the ability to | inflated synonym |
| synergy / synergize | (describe the actual combined effect) | empty jargon |
| bespoke | custom, purpose-built | inflated synonym |
| cutting-edge / state-of-the-art | new, recent | inflated synonym |
| transformative | (describe the actual change) | vague intensifier |
| revolutionize / revolutionary | (describe the actual change) | vague intensifier |
| meticulous / meticulously | careful, carefully | inflated synonym |
| intricate | complex, detailed | inflated synonym |
| multifaceted | (name the actual facets) | vague, says nothing concrete |
| plethora | many, a lot of | inflated synonym |
| myriad | many | inflated synonym |
| endeavor (as a verb/noun) | try, project, effort | inflated synonym |
| delve (into) | look into, dig into | AI-tell verb, rarely used by humans in this sense |
| unpack (a concept) | explain, break down | AI-tell verb when used non-literally |
| underscore (as a verb) | show, highlight | inflated synonym |
| harness (as a verb) | use | inflated synonym |
| cultivate | build, grow | inflated synonym |
| boast / boasts (a feature) | has | inflated synonym |
| noteworthy | worth noting, notable — or just say the fact | filler qualifier |

## Phrase-level

| Flagged phrase | Plain alternative | Context |
|---|---|---|
| in today's fast-paced [world / environment / landscape] | (delete — adds nothing) | stock AI opener |
| in the ever-evolving landscape of X | (delete, or name the specific change) | stock AI opener |
| navigate the complexities of | deal with, handle | inflated phrase |
| unlock the potential of | make it possible to, get more out of | inflated phrase |
| at the intersection of X and Y | (describe the actual relationship) | inflated phrase |
| dive into / deep dive into | look at, go through | stock AI transition |
| double-click on (as in "look closer") | look closer at | borrowed jargon, not literal |
| pave the way for | make it possible to, lead to | inflated phrase |
| serves as a testament to | shows | stock AI phrase |
| it's important to note that | (delete, just state the fact) | filler hedge |
| it's worth noting that | (delete, just state the fact) | filler hedge |
| rest assured | (delete, or state the fact plainly) | filler reassurance |
| not only X, but also Y | X and Y | stock AI sentence pattern |
| a testament to | proof of, shows | inflated phrase |
| game-changer / game-changing | (describe the actual impact) | vague intensifier |
| best-in-class / world-class | (name the actual comparison or metric) | unsupported superlative |
| tapestry of | mix of, range of | stock AI metaphor |
| journey (used for a project or process) | project, process, work | stock AI metaphor |
| ecosystem (used loosely for "the surrounding tools/systems") | (name the actual systems) | overused metaphor |

## Logged from feedback

| Flagged term | Plain alternative | Context |
|---|---|---|
| invariant | rule, condition that always holds — or just describe what's actually always true | 2026-09-15 — flagged directly by the user as overused by AI; reserve the technical sense (a loop/database invariant) for cases where that precision is actually load-bearing |
