# React polymorphism (strategy over shotgun surgery) (Cursor rule)
scope: project
version: 0.1.0

Apply this rule when the user asks to:
- varying behavior by type
- too many if/else
- shotgun surgery
- strategy pattern React
- polymorphism frontend
- different calculation per type

When generating or editing output:
- When the same kind of decision (e.g. how to compute tip, which label to show) is repeated in multiple places, consider a single abstraction (strategy, polymorphic type) so adding or changing a variant happens in one place
- Conditionals that depend on type or mode are centralized in domain objects or small strategy modules rather than duplicated in hooks and components
- New variants (e.g. a new round-up strategy) are added by extending the abstraction, not by editing many call sites

The 'shotgun surgery' problem: when round-up logic or similar varies (e.g. by country, product), avoid scattering if (country === X) across hooks and views. Use polymorphism (e.g. RoundUpStrategy, or a small hierarchy) so each strategy encapsulates its rules. Reference: 'Modularizing React Applications with Established UI Patterns' – Polymorphism to the rescue (https://martinfowler.com/articles/modularizing-react-apps.html).

Avoid:
- Introducing polymorphism for one or two simple conditionals with no likelihood of new variants
- Replacing clear conditionals with unnecessary indirection

# metadata
id: charlie.frontend-architecture.react-polymorphism