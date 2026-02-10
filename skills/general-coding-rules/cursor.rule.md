# General coding rules (Cursor rule)
scope: project
version: 0.1.0

Apply this rule when the user asks to:
- write code
- refactor
- review code
- implement
- fix bug
- add function
- coding style

When generating or editing output:
- Prefer guard clauses (early return / early exit) over nested if/else; handle invalid or edge cases first and return early, then keep the main path at the top level.
- Be conservative when adding comments. Avoid comments that describe iterative changes to the code or that describe behavior easily inferred by reading the code (e.g. do not leave comments like "Use zod instead of yup" that refer to temporary choices during development).
- Only add comments that provide long-term value (posterity) and context that might not be obvious from reading the code itself.
- Do not remove comments unless the associated code has also been removed or modified, or unless explicitly instructed.
- Be very conservative when adding comments to test files.

Add more universal rules to guarantees as you adopt them. Keep rules language-agnostic and generally applicable (e.g. guard clauses, single level of abstraction, small functions).

Avoid:
- Language-specific formatting (use linters/formatters for that)
- Overriding project or framework conventions that conflict with these rules

# metadata
id: charlie.general-coding-rules