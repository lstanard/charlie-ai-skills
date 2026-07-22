# Transcript: debounce utility implementation

## Task

Add a `debounce` utility function to `src/utils/timing.ts` that delays invoking a callback until after a given number of milliseconds have elapsed since the last call.

## Steps taken

1. Confirmed the outputs directory did not exist and created it.

2. Designed the `debounce` function with the following considerations:
   - Generic type parameter `T` constrained to a function type, so the returned debounced function preserves the original parameter types via `Parameters<T>`.
   - A `cancel` method attached to the returned function, allowing callers to clear any pending invocation (a standard and useful addition to debounce implementations).
   - Used `ReturnType<typeof setTimeout>` for the timer variable type to work correctly in both Node.js and browser environments without importing environment-specific types.
   - The callback is only invoked after `wait` ms of inactivity; each new call resets the timer.

3. Added a JSDoc block covering `@param`, `@returns`, and a usage `@example`.

4. Wrote the file to the outputs directory as `timing.ts`.

## Design decisions

- `cancel()` is included because it is the minimal useful addition beyond the core delay behavior — without it, callers cannot clean up pending timers on unmount/teardown.
- The return type is explicitly typed as the intersection of the debounced function signature and `{ cancel: () => void }` so TypeScript consumers get full type safety on both the call signature and the cancel method.
- No external dependencies are used.
