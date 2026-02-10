# React domain models (encapsulate logic) (Cursor rule)
scope: project
version: 0.1.0

Apply this rule when the user asks to:
- domain model React
- encapsulate logic
- data mapping React
- logic in view
- defaultChecked
- label formatting
- convert API response

When generating or editing output:
- Data transformation from API/shape A to view-facing shape is done in a dedicated place (domain object, mapper, or factory), not inline in components or hooks
- Derived values and flags (e.g. isDefault, label, display text) are exposed via domain object getters/methods, not computed in JSX or repeated conditionals
- Null/empty handling and fallbacks are defined in the domain or data layer, not scattered in the view
- Domain objects are UI-agnostic and testable without rendering

Logic leaks in the view (e.g. method.provider === 'cash' in JSX) scatter rules and make changes harder. Centralize in a PaymentMethod-like object that exposes provider, label, isDefaultMethod, etc. Reference: 'Modularizing React Applications with Established UI Patterns' – Data modelling to encapsulate logic (https://martinfowler.com/articles/modularizing-react-apps.html).

Avoid:
- Requiring classes; plain objects with functions or modules can serve as domain models
- Moving every tiny conditional into a model when it is purely presentational

# metadata
id: charlie.frontend-architecture.react-domain-models