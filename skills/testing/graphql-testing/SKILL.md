# GraphQL testing
version: 0.1.0

## Purpose
Mock GraphQL queries and mutations at the client layer (MockedProvider for Apollo) or network layer (MSW). Match by operation name and variables; use schema-aware mocks for large schemas. Combine with factories for consistent test data.

## Triggers
- GraphQL testing
- MockedProvider
- MSW GraphQL
- Apollo testing
- GraphQL mocks
- query testing
- mutation testing

## Inputs

## Guarantees
- Mock at the appropriate layer: use MockedProvider (Apollo Client) for unit/component tests, or MSW (Mock Service Worker) for integration tests and framework-agnostic mocking
- Match GraphQL requests by operation name and variables; avoid overly broad mocks that hide missing test cases
- For large or changing schemas, consider schema-aware mocks (@graphql-tools/mock) or codegen-based mock builders to ensure responses conform to the schema
- Test both success and error responses: mock GraphQL errors (field errors, network errors) and loading states
- Combine with factories (mock-data-strategy skill): use factory-built objects in MockedProvider mocks or MSW handlers for consistent, overridable test data
- For mutations, test optimistic updates, cache updates, and refetch behavior where applicable
- When testing Apollo hooks (useQuery, useMutation), render components with MockedProvider and assert on loading, data, and error states

## Non-goals
- Testing GraphQL server implementation (this is for client-side testing)
- Replacing contract tests or schema validation (use schema checks for that)
- Mocking every query in the schema (focus on queries used in the component under test)

## Notes
For Apollo Client, wrap components in MockedProvider with a `mocks` array: [{ request: { query: GET_USER, variables: { id: '1' } }, result: { data: { user: userFactory.build() } } }]. For MSW, use graphql.query('GetUser', (req, res, ctx) => res(ctx.data({ user: userFactory.build() }))). Match variables with req.variables to return different mocks. For errors, use result: { errors: [{ message: 'Not found' }] } (MockedProvider) or res(ctx.errors([{ message: 'Not found' }])) (MSW). Schema-aware mocks: @graphql-tools/mock can generate mock resolvers from your schema, useful for large schemas. See CLAUDE.md in the testing/ directory for universal testing principles.