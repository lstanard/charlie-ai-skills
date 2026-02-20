# Testing (reference)

Shared reference for all testing skills: philosophy, test pyramid, anti-patterns, and universal principles.

## Testing Philosophy

- **Behavior over implementation** – Test what users see and do, not internal code structure
- **Test pyramid** – Many unit tests, some integration tests, few E2E tests
- **Coverage as signal, not target** – Use coverage to find gaps, not to chase 100%
- **Write tests that give confidence** – Focus on critical paths and edge cases
- **Keep tests maintainable** – Tests should help refactoring, not hinder it

## Testing Pyramid

1. **Unit / component** (70%) – Most tests. Pure logic, isolated functions, individual components.
2. **Integration** (20%) – Key interactions across a few modules or with mocked external services.
3. **E2E** (10%) – Few, focused tests for critical user flows across the full stack.

The pyramid keeps test suites fast and maintainable while still catching bugs at the right level.

## Anti-Patterns to Avoid

### Testing Implementation Details
- ❌ Testing internal state or props directly
- ❌ Testing library internals (e.g., Redux action creators, React hook internals)
- ❌ Querying by class names or DOM structure
- ✅ Test user-visible behavior and outcomes

### Async Testing Issues
- ❌ Using `waitFor` without assertions (empty waitFor blocks)
- ❌ Arbitrary timeouts (`setTimeout` in tests)
- ❌ Not waiting for async operations to complete
- ✅ Use `findBy*` queries, `waitFor` with assertions, or `await` async calls

### Over-Mocking
- ❌ Mocking so much that you're testing the mocks, not real code
- ❌ Mocking everything "just in case"
- ✅ Mock at boundaries (network, external services), test real code

### Other Common Mistakes
- ❌ Ignoring `act()` warnings in React tests
- ❌ Shared mutable state between tests (use beforeEach/afterEach)
- ❌ Tests that depend on execution order
- ❌ Copy-pasted fixtures that drift from reality

## Test Organization

### File Structure
- **Location:** `__tests__/*.test.tsx` (or `*.test.ts` for non-TSX)
- **Co-locate tests** with source files:
  ```
  components/
    Button/
      Button.tsx
      __tests__/
        Button.test.tsx
  ```
- **Shared test utilities:** `test/utils/`, `test/fixtures/`, or `test/factories/`

### Naming Conventions
- **Files:** `ComponentName.test.tsx` or `functionName.test.ts`
- **Test descriptions:** Describe behavior, not implementation
  - ✅ "should render error message when API fails"
  - ✅ "should disable submit button while loading"
  - ❌ "should set isLoading to true"
  - ❌ "should call handleSubmit"

### Test Structure
```typescript
describe('ComponentName', () => {
  // Setup
  beforeEach(() => {
    // Common setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should do X when Y', () => {
    // Arrange
    // Act
    // Assert
  });
});
```

## Error and Loading States

Always test the unhappy paths:
- Network failures (timeout, 500, 404)
- Validation errors
- Loading states (spinners, skeletons)
- Empty states (no data)
- Permission denied / unauthorized

These are where bugs hide and users get frustrated.

## Test Performance

### Keep Tests Fast
- Run unit tests in parallel (Jest/Vitest default)
- Avoid unnecessary setup/teardown
- Mock slow operations (network, file I/O)
- Use `test.only` / `fit` for debugging single tests

### CI Optimization
- Limit parallel workers: `--maxWorkers=2` (CI has fewer cores)
- Cache dependencies and build artifacts
- Run unit tests on every commit, E2E only on PR/main
- Fail fast: stop on first failure in CI

## Flake Prevention

Flaky tests erode confidence and waste time. Common causes:
- **Timing issues** – Use proper async waiting, not arbitrary timeouts
- **Non-deterministic data** – Avoid `Date.now()`, `Math.random()` without seeding
- **Shared state** – Clean up between tests; ensure test isolation
- **External dependencies** – Mock network, databases, file system
- **Race conditions** – Wait for operations to complete before asserting

## Test Lifecycle

```typescript
beforeAll(() => {
  // One-time setup (expensive operations)
});

beforeEach(() => {
  // Per-test setup (reset state, create fresh fixtures)
});

afterEach(() => {
  // Per-test cleanup (clear mocks, restore state)
});

afterAll(() => {
  // One-time teardown (close connections, clean resources)
});
```

Always clean up to prevent tests from affecting each other.

## Security Testing

Test security-critical flows:
- Authentication (login, logout, session expiry)
- Authorization (role-based access, permission checks)
- XSS prevention (render user input safely)
- CSRF protection (token validation)

**Never commit real credentials in tests.** Use fake data or environment variables for test auth.

## Accessibility Testing

**For comprehensive accessibility testing guidance, use the `accessibility-testing` skill.**

Key principle: **Use accessible queries** (getByRole, getByLabelText) over test IDs or class names. Tests using accessible queries naturally verify that screen readers and keyboard navigation work.

Accessibility is a legal requirement (ADA, Section 508, WCAG 2.1) and makes your app better for everyone. The accessibility-testing skill covers:
- Automated checks (jest-axe, @axe-core/react)
- Keyboard navigation testing
- ARIA patterns and screen reader semantics
- Focus management

## References

- [Testing Library – Guiding Principles](https://testing-library.com/docs/guiding-principles/)
- [Test Pyramid (Martin Fowler)](https://martinfowler.com/articles/practical-test-pyramid.html)
- [Vitest](https://vitest.dev/)
- [Jest](https://jestjs.io/)
- [jest-axe](https://github.com/nickcolley/jest-axe)
- [WebAIM – Web Accessibility Resources](https://webaim.org/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
