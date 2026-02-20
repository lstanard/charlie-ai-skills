# React component testing
version: 0.1.0

## Purpose
Test React components with React Testing Library: query by role, label, or accessible text; assert on user-visible behavior; avoid testing implementation details. Use Jest or Vitest. Includes accessibility testing with jest-axe.

## Triggers
- write tests
- add tests
- React testing
- component test
- unit test
- React Testing Library
- RTL
- Jest
- Vitest
- accessibility testing
- a11y testing

## Inputs

## Guarantees
- Use React Testing Library; query by role, label, or accessible text; assert on user-visible behavior and interactions, not internal state or DOM structure
- Query priority: prefer getByRole, then getByLabelText, then getByText; avoid querying by test IDs or class names when an accessible query exists
- Use userEvent (from @testing-library/user-event) over fireEvent for interactions; userEvent simulates real browser events more accurately
- Test with screen-reader semantics and keyboard navigation; prefer getByRole and accessible queries; consider axe (e.g. jest-axe) for automated a11y checks
- For hooks testing, use @testing-library/react-hooks or renderHook from @testing-library/react (v13+)
- Avoid testing implementation details: no direct prop/state assertions, no querying by class names, no testing React internals
- Test error states, loading states, and edge cases; not just happy paths
- Use snapshots sparingly: prefer inline snapshots for specific values (e.g., computed styles, generated markup) over full component snapshots
- For Vite projects: same strategy using Vitest, @testing-library/react, and jsdom (or happy-dom)
- Place tests in __tests__/*.test.tsx co-located with components; name files ComponentName.test.tsx

## Non-goals
- Testing third-party library internals
- Testing implementation details (state, props, class names)
- Replacing E2E tests (use e2e-playwright skill for critical flows)
- Testing styles in detail (use visual regression tools for that)

## Notes
Default stack: Jest + React Testing Library for non-Vite projects; Vitest + React Testing Library for Vite projects. For accessible queries, use getByRole('button', { name: 'Submit' }) over getByTestId('submit-btn'). For async operations, prefer findBy* queries (which wait) over getBy* with manual waitFor. For testing custom hooks, use renderHook (built into @testing-library/react v13+) or @testing-library/react-hooks for older versions. For accessibility, jest-axe can assert no violations: expect(await axe(container)).toHaveNoViolations(). See CLAUDE.md in the testing/ directory for universal testing principles, anti-patterns, and file organization.