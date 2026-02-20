# Frontend testing (reference)

Reference for the frontend-testing skill: testing pyramid, tool choice, setup, and CI.

## Testing pyramid

1. **Unit / component** – Most tests. Pure logic, hooks, and component behavior with React Testing Library (Jest or Vitest).
2. **Integration** – Key interactions across a few components or with mocked APIs; same stack as unit.
3. **E2E** – Few, focused tests for critical user flows across pages; Playwright (or similar).

## Tool choice

| Context                     | Runner | UI tests                                   | E2E        |
| --------------------------- | ------ | ------------------------------------------ | ---------- |
| Non-Vite (e.g. CRA, custom) | Jest   | @testing-library/react, jsdom              | Playwright |
| Vite                        | Vitest | @testing-library/react, jsdom or happy-dom | Playwright |

Same principles in both: behavior over implementation, accessible queries, coverage as a signal.

## React Testing Library query priority

1. **getByRole** – Best for accessibility and behavior (e.g. `getByRole('button', { name: 'Submit' })`).
2. **getByLabelText** – Forms and labeled controls.
3. **getByText** – When role/label don’t fit (prefer user-visible text).
4. **getByTestId** – Last resort when no accessible or semantic option.

Avoid querying by class names or DOM structure. Prefer `userEvent` over `fireEvent` for interactions.

## Mock data and factories

- **Factories / builders**: Use Fishery (or similar, e.g. factory-bot-style libraries) to build test objects with sensible defaults and per-test overrides. Keeps fixtures DRY and tests readable.
- **Fake data**: Use faker or @faker-js/faker for generating realistic strings, numbers, dates, etc. when you need variety or don’t care about exact values. Good for list items, form data, and API-shaped payloads.
- **Placement**: Co-locate factories with tests or put them in a shared test/fixtures (or test/factories) folder. Use factories inside GraphQL/REST mocks so responses stay consistent.

## GraphQL

- **Where to mock**: Mock at the client layer (e.g. Apollo `MockedProvider` with `mocks` array) or via MSW (GraphQL handler). Both allow matching by operation name and variables.
- **Matching**: Match requests by operation name and, when relevant, variables so the right mock runs for each query/mutation. Avoid overly broad mocks that hide missing cases.
- **Schema-aware mocks**: For large or changing schemas, consider `@graphql-tools/mock` or codegen-based mock builders so responses conform to the schema. Helps catch type/schema drift.
- **Factories + GraphQL**: Build mock response objects with your factory (e.g. Fishery) and optional faker for fields; pass them into MockedProvider or MSW handlers so UI tests get consistent, overridable data.

## Coverage

- **Jest**: `jest --coverage`; configure thresholds in `jest.config.js` (e.g. `coverageThreshold`).
- **Vitest**: `vitest run --coverage`; use `vite-plugin-coverage` or `@vitest/coverage-v8`; set thresholds in `vitest.config.*`.

Use coverage to find gaps; set thresholds (e.g. 80% lines/branches) where the team agrees. Don’t optimize for 100% at the cost of brittle or redundant tests.

## CI

Run tests (and optionally coverage) in the pipeline; fail on non-zero exit.

```yaml
# Example (GitHub Actions)
- run: npm test
- run: npm run test:coverage # if defined
```

For coverage reporting, add the appropriate upload step for the CI provider (e.g. Codecov, Coveralls). Playwright E2E can run in the same workflow or a separate job; use the official Playwright GitHub Action or equivalent.

## Vite + Vitest setup

- Install: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` (or `happy-dom`).
- In `vite.config.ts` (or `vitest.config.ts`), set `test.globals`, `test.environment: 'jsdom'`, and `test.setupFiles` if using jest-dom matchers.
- Use same RTL patterns and coverage approach as with Jest. E2E remains Playwright; no change.

## Accessibility

- Prefer `getByRole` and accessible names so tests align with screen readers and keyboard use.
- Add automated a11y checks where useful: `jest-axe` (Jest) or `@axe-core/react` (with a test runner) to assert no violations in a component tree.
- For keyboard flows, use `userEvent.keyboard` or `fireEvent.keyDown` and assert focus and visible outcomes.

## References

- [Testing Library – Guiding principles](https://testing-library.com/docs/guiding-principles/)
- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)
