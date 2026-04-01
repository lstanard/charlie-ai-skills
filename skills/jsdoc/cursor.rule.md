# JSDoc (Cursor rule)
scope: project
version: 0.1.0

Apply this rule when the user asks to:
- write JS/TS function
- add method
- refactor TypeScript
- implement feature in JS
- update function
- add class

When generating or editing output:
- Every function, method, class, and named arrow function declaration has a JSDoc comment.
- In TypeScript, JSDoc contains only a description — no @param or @returns tags.
- In JavaScript, JSDoc includes @param and @returns tags with types.
- Descriptions explain what the code does and why, not how it's implemented.
- Existing JSDoc is updated when the code it documents is changed.
- Test files are excluded unless the test logic itself is genuinely complex.

Avoid:
- Inline callbacks or anonymous functions passed as arguments
- Restating type information already present in TypeScript signatures

# metadata
id: charlie.jsdoc