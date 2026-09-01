---
name: "general-coding-rules"
description: "Universal style and structure rules that apply regardless of language or context. Use these whenever writing or refactoring code."
---

# General coding rules
version: 0.1.0

## Purpose
Universal style and structure rules that apply regardless of language or context. Use these whenever writing or refactoring code.

## Triggers
- write code
- refactor
- review code
- implement
- fix bug
- add function
- coding style

## Inputs

## Guarantees
- Prefer guard clauses (early return / early exit) over nested if/else; handle invalid or edge cases first and return early, then keep the main path at the top level.
- Be conservative when adding comments. Avoid comments that describe iterative changes to the code or that describe behavior easily inferred by reading the code (e.g. do not leave comments like "Use zod instead of yup" that refer to temporary choices during development).
- Only add comments that provide long-term value (posterity) and context that might not be obvious from reading the code itself.
- Do not remove comments unless the associated code has also been removed or modified, or unless explicitly instructed.
- Be very conservative when adding comments to test files.
- Run ESLint (project lint script, or `npx eslint .`) and fix all errors before declaring the task complete. Errors such as unsorted imports, unused variables, and rule violations block commits. Do not add inline disable comments unless the project already uses them.
- Run Prettier check (project format-check script, or `npx prettier --check .`) and fix all formatting issues before declaring the task complete. Formatting issues break pre-commit hooks. Run `npx prettier --write .` to fix, then verify the check is clean.
- Run the TypeScript type-checker (project type-check script, or `npx tsc --noEmit`) and fix all errors before declaring the task complete. This catches diagnostic errors ('Expected 0 arguments but got 1', `any` where disallowed, missing properties) that do not stop the app from starting but appear as IDE errors and represent real bugs. Zero errors is the only acceptable exit state. Do not suppress errors with `@ts-ignore` or unsafe `as` casts.

## Non-goals
- Manually formatting code — delegate to Prettier; the goal is a clean `prettier --check`, not hand-formatting
- Overriding project or framework conventions that conflict with these rules

## Notes
Add more universal rules to guarantees as you adopt them. Keep rules language-agnostic and generally applicable (e.g. guard clauses, single level of abstraction, small functions).