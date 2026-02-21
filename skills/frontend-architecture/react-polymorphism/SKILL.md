---
name: react-polymorphism
description: When behavior varies by type or strategy (e.g. round-up rules, payment types), use polymorphism (strategy pattern, small class hierarchy, or type-based dispatch) instead of scattering conditionals across the codebase.
---

# React polymorphism (strategy over shotgun surgery)
version: 0.1.0

## Purpose
When behavior varies by type or strategy (e.g. round-up rules, payment types), use polymorphism (strategy pattern, small class hierarchy, or type-based dispatch) instead of scattering conditionals across the codebase.

## Triggers
- varying behavior by type
- too many if/else
- shotgun surgery
- strategy pattern React
- polymorphism frontend
- different calculation per type

## Inputs

## Guarantees
- When the same kind of decision (e.g. how to compute tip, which label to show) is repeated in multiple places, consider a single abstraction (strategy, polymorphic type) so adding or changing a variant happens in one place
- Conditionals that depend on type or mode are centralized in domain objects or small strategy modules rather than duplicated in hooks and components
- New variants (e.g. a new round-up strategy) are added by extending the abstraction, not by editing many call sites

## Non-goals
- Introducing polymorphism for one or two simple conditionals with no likelihood of new variants
- Replacing clear conditionals with unnecessary indirection

## Notes
The 'shotgun surgery' problem: when round-up logic or similar varies (e.g. by country, product), avoid scattering if (country === X) across hooks and views. Use polymorphism (e.g. RoundUpStrategy, or a small hierarchy) so each strategy encapsulates its rules. Reference: 'Modularizing React Applications with Established UI Patterns' – Polymorphism to the rescue (https://martinfowler.com/articles/modularizing-react-apps.html).