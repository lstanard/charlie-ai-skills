# Frontend testing

version: 0.1.0

## Purpose

React frontend testing strategy: prefer Jest with React Testing Library (behavior over implementation) and Playwright for E2E. Use when writing or reviewing tests, setting up test infrastructure, or configuring CI and coverage. For Vite projects, the same approach applies using Vitest and Vite-native testing tools.

## Triggers

- write tests
- add tests
- frontend testing
- React testing
- unit test
- component test
- integration test
- E2E
- end-to-end test
- Playwright
- Jest
- React Testing Library
- Vitest
- test coverage
- CI tests
- accessibility testing
- test strategy
- mock data
- mocks
- factory
- faker
- GraphQL testing

## Inputs

## Guarantees

- Test business logic and edge cases; keep logic testable (e.g. pure functions or hooks); avoid testing implementation details
- Use React Testing Library; query by role, label, or accessible text; assert on user-visible behavior and interactions, not internal state or DOM structure
- Test with screen-reader semantics and keyboard navigation; prefer getByRole and accessible queries; consider axe (e.g. jest-axe) for automated a11y checks where appropriate
- Use snapshots or visual assertions only when necessary for given props/state; keep snapshots small and stable; avoid large, brittle DOM snapshots
- Cover critical multi-page or multi-step workflows with E2E tests (e.g. Playwright); keep E2E suite focused on critical paths
- Run tests in the project's CI pipeline; fail the pipeline on test failure; document or configure the test step when the user asks
- Use code coverage (e.g. Jest --coverage, Vitest coverage); set and enforce thresholds where it makes sense; avoid chasing 100% at the cost of maintainability
- For Vite projects: same strategy using Vitest, @testing-library/react, and jsdom (or happy-dom); E2E still via Playwright if applicable
- Use factory/builders (e.g. Fishery) for test object construction; use a fake-data library (e.g. faker / @faker-js/faker) for generating realistic values; keep mocks consistent and easy to override per test
- For GraphQL: mock at the client layer (e.g. MockedProvider) or with MSW; match operations by name and variables; consider schema-aware mocks or generated mock data from the schema where it helps

## Non-goals

- Testing third-party library internals
- Mandating a single E2E tool (Playwright is recommended, not the only option)
- Achieving 100% coverage regardless of cost or brittleness
- Replacing manual QA for one-off or exploratory flows

## Notes

Default stack: Jest + React Testing Library for unit/component tests; Playwright for E2E when needed. Query priority: prefer getByRole, then getByLabelText, then getByText; avoid querying by test IDs or class names when an accessible query exists. For mocks: Fishery (or similar) for factories; faker / @faker-js/faker for fake data. For GraphQL: use MockedProvider (Apollo) or MSW; match by operation and variables; schema-aware or generated mocks when useful. For Vite, recommend Vitest + @testing-library/react with the same behavior-over-implementation and coverage approach. Incorporate tests into CI when a pipeline exists; suggest a minimal run-tests and optional coverage step when the user asks. For setup and config details, see CLAUDE.md in this skill directory.
