# Frontend architecture (React modularization)

Reference knowledge for the frontend-architecture skills. Source: [Modularizing React Applications with Established UI Patterns](https://martinfowler.com/articles/modularizing-react-apps.html) (Juntao Qiu, Martin Fowler, 2023) and [Presentation–Domain–Data Layering](https://martinfowler.com/bliki/PresentationDomainDataLayering.html).

## Core idea

React is a **library for building user interfaces**, not a full application framework. Treat the app as a normal application that **uses React as its view layer**. Separate view from non-view logic and split non-view logic by responsibility (domain vs data). Benefits: change domain or data without touching the view, and reuse domain logic elsewhere.

## Evolution path (direction to grow)

1. **Single component** – Everything in one component; fine for tiny apps.
2. **Multiple components** – Split by what appears on screen; one responsibility per component.
3. **State in hooks** – Move state and side effects into custom hooks; keep components more stateless.
4. **Domain models** – Extract mapping, null handling, derived flags (e.g. `isDefaultMethod`, `label`) into domain objects; view consumes domain types only.
5. **Layered app** – Presentation (React) / Domain (models, rules) / Data (network, cache, storage) clearly separated.

## Patterns referenced by the skills

| Concern | Anti-pattern | Pattern |
|--------|--------------|--------|
| Where logic lives | Data fetch + mapping + render in one component | **Layering**: View / Domain / Data; React = view only. |
| State and side effects | Large component with useState + useEffect + JSX | **View extraction**: Custom hooks for state/effects; extract sub-components; prefer pure presentational components. |
| Mapping and rules | `method.provider === 'cash'` in JSX; mapping in useEffect | **Domain models**: Class or object that encapsulates provider, label, isDefaultMethod; mapper converts API → domain. |
| Data access | `fetch(url)` inside component or hook | **Data layer**: Dedicated client/service; hooks or domain call it; URLs and request logic in one place. |
| Varying behavior | if (country === X) / if (type === Y) in many places | **Polymorphism**: Strategy or small type hierarchy; add variants in one place. |

## File/layer layout (example)

Not prescribed; one possible layout:

```
src/
├── components/   # Presentational components (pure where possible)
├── hooks/        # State and orchestration; may call data layer + domain
├── models/       # Domain objects (mapping, getters, rules)
├── api/ or services/  # Data layer (fetch, URLs, cache)
└── types.ts
```

## Pitfalls to avoid

- **Logic in the view**: Conditionals that express business rules (e.g. “is this the default method?”) should live in domain or hooks, not in JSX.
- **Data reshaping in the component**: Map API → view shape in a mapper or domain constructor, not inside useEffect or inside the component.
- **Shotgun surgery**: Adding a new variant (e.g. round-up rule) by editing many files. Prefer one abstraction (e.g. strategy) and add the new variant there.
- **Oversplitting**: Keep small, cohesive pieces together when the whole behavior is easier to understand in one place. Avoid so many tiny files that navigation hurts.

## Related skills in this directory

- **react-layering** – Apply PDD; keep view vs domain vs data separate.
- **react-view-extraction** – Hooks for state/effects; extract components; pure presentational components.
- **react-domain-models** – Encapsulate mapping and rules in domain objects.
- **react-data-layer** – Extract network/client; no fetch in components.
- **react-polymorphism** – Strategy (or polymorphism) instead of scattered conditionals.
