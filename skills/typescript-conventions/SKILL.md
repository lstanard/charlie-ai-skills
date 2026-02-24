---
name: typescript-conventions
description: TypeScript-specific style and structure rules: barrel exports, strict typing, type safety patterns. Apply when writing or reviewing TypeScript code.
---

# TypeScript conventions
version: 0.1.0

## Purpose
TypeScript-specific style and structure rules: barrel exports, strict typing, type safety patterns. Apply when writing or reviewing TypeScript code.

## Triggers
- TypeScript
- write types
- type definitions
- interfaces
- generics
- any type
- unknown type
- barrel exports
- index.ts
- type assertions
- type guards

## Inputs

## Guarantees
- Use barrel exports: each module directory gets an index.ts that re-exports its public API; consumers import from the directory, not from internal files (e.g. `import { UserCard } from './components'`, not `'./components/UserCard/UserCard'`).
- Never use `any`; use `unknown` for values whose type is genuinely unknown and narrow with type guards before use; for untyped third-party data use a specific interface or `Record<string, unknown>`.
- Avoid non-null assertions (`!`); prefer optional chaining (`?.`), nullish coalescing (`??`), or an explicit type guard; if `!` is truly necessary, add a comment explaining why the value is known to be non-null.
- Prefer type narrowing (typeof, instanceof, discriminant properties, type predicates) over type assertions (`as`); only use `as` when you have information the compiler cannot infer, and add a comment explaining why.
- Mark function parameters that must not be mutated as `readonly`; use `Readonly<T>` and `ReadonlyArray<T>` (or `readonly T[]`) for immutable data structures.
- Use `interface` for object shapes that may be extended or implemented; use `type` for unions, intersections, mapped types, and aliases.
- Model variants with discriminated unions (a shared literal field like `kind` or `type`) rather than optional properties; this makes exhaustiveness checking possible and removes the need for runtime presence checks.
- Avoid `enum`; prefer a `const` object with `as const` and a derived union type (e.g. `type Status = typeof STATUS[keyof typeof STATUS]`) — this compiles away cleanly and is compatible with string literals.
- Use the `satisfies` operator (TS 4.9+) to validate that a value matches a type without widening it; prefer `satisfies` over `as` when the goal is type-checking rather than casting.

## Non-goals
- tsconfig settings — those are project-level concerns
- Formatting and style (use Prettier and ESLint/typescript-eslint for that)
- Framework-specific TypeScript patterns (covered by framework-specific skills)

## Notes