# React data layer (network client) (Cursor rule)
scope: project
version: 0.1.0

Apply this rule when the user asks to:
- fetch in useEffect
- API call in component
- data layer
- network client
- where to fetch data React
- data access React

When generating or editing output:
- HTTP/API calls are made from a dedicated module (e.g. paymentMethodApi, orderService), not from inside useEffect in components or from hooks that are primarily UI state
- Hooks or domain layer call the data-layer API; the data layer returns raw or minimally shaped data; domain/models handle mapping to view-facing types where appropriate
- Data layer can be swapped (e.g. mock, different endpoint, cache) without changing components or domain logic
- URLs, headers, and request construction live in the data layer, not in components

Push the design a bit further: extract a network client so that usePaymentMethods (or similar) calls something like fetchPaymentMethods() from a client, rather than containing fetch() and URL logic. Reference: 'Modularizing React Applications with Established UI Patterns' (https://martinfowler.com/articles/modularizing-react-apps.html).

Avoid:
- Mandating a specific HTTP library or cache strategy
- Moving one-off fetch calls in a tiny app into a full abstraction when there is no need to swap or test

# metadata
id: charlie.frontend-architecture.react-data-layer