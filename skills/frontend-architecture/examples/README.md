# Frontend Architecture Examples

Code examples demonstrating the patterns from [Modularizing React Applications](https://martinfowler.com/articles/modularizing-react-apps.html).

Each example shows **before/after** code with detailed explanations.

## All Examples

### 01-layering: User Profile ✅
**Pattern:** Presentation-Domain-Data (PDD) layering - full evolution from monolith to layered architecture

**Files:**
- `step0-everything-in-component.tsx` - Everything in one component (125 lines)
- `step1-extract-hooks.tsx` - State extracted to custom hooks
- `step2-add-domain-model.tsx` - Business logic in User class
- `step3-extract-data-layer.tsx` - Network calls in UserAPIClient
- `explanation.md` - Complete evolution guide with testing examples

**Key concepts:**
- Separation of concerns: View / Domain / Data
- Custom hooks for state management
- Domain models for business logic
- API client for network layer
- Each layer independently testable

---

### 02-view-extraction: Product List ✅
**Pattern:** Extract hooks and sub-components for better composition and testability

**Files:**
- `before.tsx` - Large 100+ line component with mixed concerns
- `after-hooks.tsx` - State and logic extracted to custom hooks
- `after-components.tsx` - Sub-components extracted (ProductCard, ProductFilters, ProductHeader)
- `explanation.md` - Step-by-step extraction guide

**Key concepts:**
- Custom hooks for reusable logic
- Sub-component extraction
- Pure presentational components
- Component composition pattern
- Single Responsibility Principle

---

### 03-domain-models: Payment Methods ✅
**Pattern:** Extract mapping logic and business rules into domain model classes

**Files:**
- `before.tsx` - Component with inline mapping and business logic
- `payment-method.ts` - Domain model encapsulating rules
- `after.tsx` - Clean component using domain model
- `explanation.md` - Why, when, and how to apply this pattern

**Key concepts:**
- Mapping API shape → display format
- Encapsulating business rules (canDelete, isDefault)
- Testability without React
- Reusability across components
- Null handling and type safety

---

### 04-data-layer: API Client ✅
**Pattern:** Extract fetch calls into dedicated API client for separation of concerns

**Files:**
- `before.tsx` - Component with inline fetch calls
- `api-client.ts` - PostAPIClient class with all network logic
- `after.tsx` - Component using API client
- `explanation.md` - Benefits, testing, and extensibility patterns

**Key concepts:**
- Centralized API endpoints
- Consistent error handling
- Easy to mock for tests
- Switching from REST to GraphQL
- Adding auth, retry logic, caching

---

### 05-polymorphism: Discount Rules ✅
**Pattern:** Replace scattered conditionals with strategy pattern (polymorphism)

**Files:**
- `before.tsx` - Conditionals for discount types (shotgun surgery)
- `discount-strategies.ts` - Strategy interface + concrete implementations
- `after.tsx` - Component using strategies
- `explanation.md` - Open/Closed Principle, adding new strategies, runtime selection

**Key concepts:**
- Strategy pattern
- Open/Closed Principle (extend without modifying)
- No shotgun surgery when adding variants
- Independently testable strategies
- Runtime strategy selection

---

## How to Use These Examples

### For Humans:
1. **Browse** this README to find relevant patterns
2. **Read** `explanation.md` for problem/solution context
3. **Compare** `before.tsx` → `after.tsx` to see the transformation
4. **Apply** the pattern to your own code using examples as templates

### For AI Agents:
**In conversation with Claude Code:**
```
Refactor this component using the layering pattern from examples/01-layering/
```

Claude will:
1. Read the example files from the skill directory
2. Understand the before/after transformation
3. Apply the same pattern to your code
4. Follow the testing approach from the explanation

**Or reference specific patterns:**
```
I have scattered conditionals for payment methods.
Use the polymorphism pattern from examples/05-polymorphism/
```

### Project-Wide Application:
```
Review all components in src/components/ and suggest which patterns
from skills/frontend-architecture/examples/ would improve each one
```

---

## Pattern Selection Guide

**When your component has:**
- Mix of view, domain, and data concerns → **01-layering**
- 100+ lines with multiple responsibilities → **02-view-extraction**
- Inline mapping logic or business rules → **03-domain-models**
- fetch() calls and API URLs → **04-data-layer**
- Scattered if/else for variants → **05-polymorphism**

**Apply patterns incrementally:**
1. Start with **04-data-layer** (easiest: extract API calls)
2. Add **03-domain-models** (extract business logic)
3. Apply **02-view-extraction** (break into sub-components)
4. Use **05-polymorphism** for varying behavior
5. Result: **01-layering** achieved (full PDD separation)

---

## Testing Examples

Each `explanation.md` includes testing examples showing:
- Before: How testing was hard
- After: How testing becomes easy
- Specific code examples for Jest/React Testing Library

---

## References

- [Modularizing React Applications](https://martinfowler.com/articles/modularizing-react-apps.html) - Original article
- [Presentation–Domain–Data Layering](https://martinfowler.com/bliki/PresentationDomainDataLayering.html) - Martin Fowler
- Skills: `skills/frontend-architecture/react-{layering,view-extraction,domain-models,data-layer,polymorphism}/`
