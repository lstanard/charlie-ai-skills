# Transcript: RequestQueue Implementation

## Task

Create a `RequestQueue` class in TypeScript that processes async tasks one at a time with a configurable concurrency limit.

## Steps Taken

1. Created the output directory at the specified path.

2. Designed the class interface:
   - `RequestQueueOptions` — constructor config, accepts `concurrency` (default: 1).
   - `Task<T>` — a zero-argument function returning `Promise<T>`.
   - `QueueEntry<T>` — internal queue item holding the task and its deferred resolve/reject handles.

3. Implemented `RequestQueue`:
   - Constructor validates that `concurrency` is a positive integer and throws `RangeError` if not.
   - `add<T>(task)` wraps the task in a `Promise`, pushes it to an internal queue, and calls `tick()`.
   - `tick()` drains the queue up to the concurrency limit, incrementing `this.running` for each started task and decrementing it (then re-calling `tick()`) when each task settles.
   - Exposed read-only getters: `size`, `activeCount`, `pendingCount`.

4. Exported the class and relevant types for external consumption.

## Design Decisions

- Default concurrency of 1 means serial (FIFO) execution out of the box.
- Errors in individual tasks reject only that task's promise; they do not halt the queue.
- No external dependencies — pure TypeScript using standard `Promise` APIs.
- Used a private `tick()` method rather than a recursive async loop to avoid unnecessary microtask overhead and keep control flow explicit.
