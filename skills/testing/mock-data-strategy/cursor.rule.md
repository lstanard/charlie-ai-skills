# Mock data strategy (Cursor rule)
scope: project
version: 0.1.0

Apply this rule when the user asks to:
- mock data
- test data
- factory
- faker
- fixtures
- test builders
- Fishery

When generating or editing output:
- Use factory/builders (e.g., Fishery, factory-bot-style libraries) to build test objects with sensible defaults and per-test overrides
- Use a fake-data library (e.g., faker / @faker-js/faker) for generating realistic values (names, emails, dates, etc.) when exact values don't matter
- Keep factories DRY: define defaults once, override only what's specific to each test
- Make factories composable: allow factories to reference other factories (e.g., user factory uses address factory)
- Place factories in test/factories/ or co-located with tests; use consistent naming (e.g., userFactory, createUser)
- Seed random generators in tests when determinism is needed (faker.seed(123) or Math.seedrandom)
- Use factories inside API mocks (GraphQL, REST) so responses stay consistent and overridable

Recommended library: Fishery (TypeScript-friendly, immutable, composable). Example: define(`user`, () => ({ id: faker.string.uuid(), name: faker.person.fullName(), email: faker.internet.email() })). Override per test: userFactory.build({ email: 'test@example.com' }). For lists, use buildList(3) to generate arrays. Factories pair well with GraphQL/REST mocks: return factory-built objects in MockedProvider or MSW handlers. See CLAUDE.md in the testing/ directory for universal testing principles and file organization.

Avoid:
- Replacing real API responses in integration tests when a real backend is available
- Generating data for production or seed scripts (this is for tests only)
- Over-abstracting simple one-off test data (plain objects are fine for trivial cases)

# metadata
id: charlie.mock-data-strategy