# E2E testing with Playwright
version: 0.1.0

## Purpose
Use Playwright for end-to-end tests covering critical multi-page workflows. Keep E2E suite focused on critical paths; test at a higher level than unit tests. Includes patterns for Page Object Model, CI parallelization, and debugging.

## Triggers
- E2E
- end-to-end test
- Playwright
- integration test
- user flow
- critical path

## Inputs

## Guarantees
- Use Playwright for multi-page or multi-step workflows that span the full stack; focus on critical user journeys (login, checkout, signup, etc.)
- Keep E2E tests at a high level: test user outcomes, not implementation details; avoid testing every edge case (that's for unit tests)
- Use Page Object Model (POM) or similar abstraction to keep tests maintainable and reduce duplication
- Run E2E tests in CI; parallelize across workers (--workers flag) to keep feedback loops fast
- Use Playwright's built-in retries (retries: 2) and screenshot/video on failure for debugging flaky tests
- Test across browsers where relevant (Chromium, Firefox, WebKit); focus on Chromium for dev, add others for critical flows
- Use Playwright's trace viewer (--trace on) for debugging failures; traces include network, console, and DOM snapshots
- For visual regression, use Playwright's screenshot comparison (toHaveScreenshot) on critical UI states (not every page)

## Non-goals
- Testing every component behavior (use react-component-testing for that)
- Replacing unit or component tests with E2E (keep the test pyramid)
- Running E2E on every commit (too slow; reserve for PR/main branch)
- Testing third-party integrations you don't control (mock or stub them)

## Notes
Setup: npx playwright install. Run: npx playwright test. Parallelize in CI: npx playwright test --workers=2. Page Object example: class LoginPage { async login(email, password) { await this.page.fill('[name=email]', email); await this.page.fill('[name=password]', password); await this.page.click('button[type=submit]'); } }. For flaky tests, check async waits (page.waitForSelector) and avoid hard timeouts. Playwright auto-waits for elements, but explicit waits help for dynamic content. For CI, use the official Playwright GitHub Action or Docker image. Visual regression: await expect(page).toHaveScreenshot('homepage.png') compares pixel-by-pixel; useful for design systems or critical UI. See CLAUDE.md in the testing/ directory for universal testing principles and flake prevention.