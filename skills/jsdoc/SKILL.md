---
name: "jsdoc"
description: "Add or update JSDoc for every function, method, class, and named arrow function touched while writing or refactoring JavaScript or TypeScript. Use for all JS/TS code changes, including small fixes."
---

# JSDoc
version: 0.1.0

## Purpose
Add or update JSDoc for every function, method, class, and named arrow function touched while writing or refactoring JavaScript or TypeScript. Use for all JS/TS code changes, including small fixes.

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
- Descriptions explain what the code does and why, not how it's implemented.
- Existing JSDoc is updated when the code it documents is changed.
- Test files are excluded unless the test logic itself is genuinely complex.

## Non-goals
- Inline callbacks or anonymous functions passed as arguments
- Restating type information already present in TypeScript signatures

## Notes