# Layering Pattern: User Profile Example

This example shows the **complete evolution** from a monolithic component to a layered architecture following **Presentation-Domain-Data (PDD)** layering.

## Evolution Path

### Step 0: Everything in one component
**File:** `step0-everything-in-component.tsx`

All responsibilities in a single component:
- ❌ Data fetching (fetch calls with URLs, error handling)
- ❌ Domain logic (plan labels, date formatting, canUpgrade rules)
- ❌ State management (useState, useEffect)
- ❌ View rendering (JSX)

**Problems:**
- Hard to test: must render component to test any logic
- Hard to reuse: fetch logic is coupled to this component
- Hard to maintain: changing API requires editing component
- Too many responsibilities: violates Single Responsibility Principle

### Step 1: Extract hooks
**File:** `step1-extract-hooks.tsx`

State and side effects move to `useUserProfile` hook:
- ✅ State management separated from rendering
- ✅ Hook is reusable in other components
- ❌ Domain logic still in component
- ❌ Fetch calls still inline in hook

**Improvements:**
- Component focuses on rendering
- State logic can be tested separately (with React Testing Library hooks)

### Step 2: Add domain model
**File:** `step2-add-domain-model.tsx`

Business logic moves to `User` class:
- ✅ Domain logic in User model (planLabel, canUpgrade, etc.)
- ✅ Component is pure presentation (just renders user properties)
- ✅ User class testable without React
- ❌ Fetch calls still in hook

**Improvements:**
- Test business logic without React: `expect(user.planLabel).toBe('Pro Plan')`
- Reuse User model across components
- Change label format in one place

### Step 3: Extract data layer
**File:** `step3-extract-data-layer.tsx`

Network calls move to `UserAPIClient`:
- ✅ All network logic in dedicated class
- ✅ Component knows nothing about API endpoints or fetch
- ✅ Easy to switch from REST to GraphQL (change data layer only)
- ✅ Data layer testable with mocks

**Final architecture:**
```
┌─────────────────────────────────────┐
│  VIEW (Presentation Layer)          │
│  UserProfile component               │  ← Just renders
│  - Renders user properties           │
│  - Handles user interactions         │
└──────────────┬──────────────────────┘
               │ uses
┌──────────────▼──────────────────────┐
│  HOOKS (Orchestration)               │
│  useUserProfile                      │  ← Manages state
│  - State management                  │
│  - Calls data + domain layers        │
└──────────────┬──────────────────────┘
               │ calls
       ┌───────┴────────┐
       │                │
┌──────▼─────┐   ┌─────▼────────┐
│  DOMAIN    │   │  DATA        │
│  User      │   │  UserAPIClient│
│  - Logic   │   │  - Network   │
│  - Rules   │   │  - Endpoints │
└────────────┘   └──────────────┘
```

## Testing

**Step 0 (monolithic):**
```tsx
// Must render component and mock fetch to test planLabel logic
render(<UserProfile />);
// Complex, brittle, slow
```

**Step 3 (layered):**
```ts
// Test domain independently
const user = new User({ plan: 'pro', ... });
expect(user.planLabel).toBe('Pro Plan');
expect(user.canUpgrade).toBe(true);

// Test data layer independently
const client = new UserAPIClient();
const user = await client.getProfile();
expect(user).toBeInstanceOf(User);

// Test component as pure presenter
render(<UserProfile />, { wrapper: withMockUser });
expect(screen.getByText('Pro Plan')).toBeInTheDocument();
```

## When to Apply Layering

**Use this pattern when:**
- ✅ Component has fetch calls
- ✅ Component has business logic (computations, rules, formatting)
- ✅ Logic needs to be reused across components
- ✅ You're building a feature with any complexity

**Don't use when:**
- ❌ Component is trivial (e.g., a simple button)
- ❌ No business logic (just displaying static data)
- ❌ One-off prototype (though it's still good practice)

## Benefits of Layering

1. **Testability**: Test each layer independently
2. **Maintainability**: Change one layer without affecting others
3. **Reusability**: Share domain models and data clients
4. **Flexibility**: Swap implementations (REST → GraphQL, fetch → axios)
5. **Clarity**: Each layer has a single responsibility

## References

- [Presentation–Domain–Data Layering](https://martinfowler.com/bliki/PresentationDomainDataLayering.html)
- [Modularizing React Applications](https://martinfowler.com/articles/modularizing-react-apps.html)
- Skills: `react-layering/`, `react-domain-models/`, `react-data-layer/`
