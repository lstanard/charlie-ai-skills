# Task Transcript: Add `debounce` utility to `src/utils/timing.ts`

## Steps taken

1. **Read the JSDoc skill** at `/Users/charliestanard/Code/personal/charlie-ai-skills/skills/jsdoc/SKILL.md` to understand the documentation rules before writing any code.

2. **Internalized the relevant rules for this task:**
   - Every function and named arrow function declaration must have a JSDoc comment.
   - Because this is TypeScript, omit `@param` and `@returns` tags — the signature carries type information already.
   - Describe what the function does and why it exists, not how it's implemented.
   - Concise: one or two sentences is almost always enough.
   - The inline anonymous callback passed to `setTimeout` is exempt from JSDoc (anonymous function passed as argument).

3. **Implemented `debounce` in `timing.ts`:**
   - Exported a generic function `debounce<T>` that accepts a callback and a delay in milliseconds.
   - Internally tracks a `timer` reference so each new call cancels the previous pending invocation.
   - Returns a new function with the same parameter signature as the original callback.
   - Applied a multi-line JSDoc comment to the function explaining its purpose and a concrete use-case (limiting rapid event handler invocations).

4. **Verified JSDoc compliance:**
   - Comment describes purpose and value, not implementation details.
   - No `@param` or `@returns` tags (TypeScript file).
   - The returned anonymous function is not documented (it is an inline return value, not a named declaration).
   - Timer variable and internal `clearTimeout`/`setTimeout` logic is self-explanatory and not over-commented.
