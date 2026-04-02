---
name: jsdoc
description: Enforce JSDoc comments on all JS/TS functions, methods, classes, and named arrow functions — both when writing new code and when modifying existing code. Use this skill whenever writing, updating, or refactoring any JavaScript or TypeScript, even for quick fixes or small additions. If you're touching a function, it must have a JSDoc comment.
---

# JSDoc
version: 0.1.0

## Purpose
Enforce JSDoc comments on all JS/TS functions, methods, classes, and named arrow functions — both when writing new code and when modifying existing code. Use this skill whenever writing, updating, or refactoring any JavaScript or TypeScript, even for quick fixes or small additions. If you're touching a function, it must have a JSDoc comment.

## Triggers
- write JS/TS function
- add method
- refactor TypeScript
- implement feature in JS
- update function
- add class

## Inputs

## Guarantees
- Every function, method, class, and named arrow function declaration has a JSDoc comment.
- In TypeScript, JSDoc contains only a description — no @param or @returns tags.
- In JavaScript, JSDoc includes @param and @returns tags with types.
- Descriptions are based solely on what the code itself shows — never pulled from conversation context, refactor history, or session-specific details.
- Descriptions are concise and factual: what the code does, not why it was changed or what problem the user was solving.
- Existing JSDoc is updated when the code it documents is changed.
- Test files are excluded unless the test logic itself is genuinely complex.

## Non-goals
- Inline callbacks or anonymous functions passed as arguments
- Restating type information already present in TypeScript signatures

## Notes