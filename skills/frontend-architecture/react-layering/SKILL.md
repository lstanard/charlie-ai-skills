# React layering (Presentation–Domain–Data)
version: 0.1.0

## Purpose
Apply Presentation–Domain–Data layering to React apps: treat React as the view layer only; keep data fetching, reshaping, and business logic out of components.

## Triggers
- design React app
- structure React app
- refactor React components
- organize frontend code
- layering
- separation of concerns React
- where to put logic in React

## Inputs

## Guarantees
- View layer (React components) does not perform data fetching, API calls, or raw data reshaping
- Domain logic and business rules live outside components (domain layer or hooks that delegate to domain)
- Data access (network, cache, local storage) is isolated in a data layer, not in components or mixed with view
- Code is organized so view, domain, and data can be reasoned about and changed relatively independently

## Non-goals
- Prescribing a specific folder structure or naming
- Replacing state management libraries; layering works with Redux, Zustand, etc.
- Applying to trivial one-off or single-component UIs where overhead is unnecessary

## Notes
Reference: Martin Fowler's Presentation–Domain–Data Layering (https://martinfowler.com/bliki/PresentationDomainDataLayering.html) and the article 'Modularizing React Applications with Established UI Patterns' (https://martinfowler.com/articles/modularizing-react-apps.html). React is a library for building user interfaces; the rest of the app (router, network, cache, business logic) should be separated so the view can change without touching domain/data and vice versa.