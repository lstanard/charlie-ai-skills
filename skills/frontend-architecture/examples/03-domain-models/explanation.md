# Domain Models Pattern: Payment Methods Example

This example demonstrates how to extract mapping logic and business rules from React components into domain model classes.

## Problem

In `before.tsx`, the component contains:
- **Mapping logic**: Converting `provider` + `last4` + `account_holder` → user-facing label
- **Business rules**: `canDelete` logic based on provider type
- **Null handling**: Checking if `last4` exists
- **Derived flags**: `isDefault` reads directly from API shape

This makes the component:
- ❌ Hard to test (must render component to test label logic)
- ❌ Hard to reuse (if another component needs payment labels, duplicate code)
- ❌ Hard to maintain (changing label format requires finding all places in JSX)

## Solution

Create a `PaymentMethod` domain model class (`payment-method.ts`) that:
- ✅ Encapsulates mapping logic in a `label` getter
- ✅ Encapsulates business rules in a `canDelete` getter
- ✅ Handles null values centrally (`last4 ?? '****'`)
- ✅ Provides a clean API for components to consume

The component (`after.tsx`) becomes a pure presenter:
- Fetches data
- Converts API data → domain models with `PaymentMethod.fromAPIList()`
- Renders using domain model properties: `method.label`, `method.canDelete`, `method.isDefault`

## Testing

**Before:** Must render component to test label logic
```tsx
render(<PaymentMethods />);
// Hard to test: need to mock fetch, wait for render, inspect DOM
```

**After:** Test domain model directly (no React needed)
```ts
const apiData = { id: '1', provider: 'stripe', last4: '4242', account_holder: '', is_default: true };
const method = PaymentMethod.fromAPI(apiData);

expect(method.label).toBe('Card ending in 4242');
expect(method.canDelete).toBe(true);
expect(method.isDefault).toBe(true);
```

## When to Use This Pattern

Use domain models when:
- ✅ You have mapping logic (API shape → display format)
- ✅ You have business rules scattered in conditionals
- ✅ You need to reuse logic across multiple components
- ✅ You have derived/computed values (e.g., "is this the default?")
- ✅ You have null/undefined handling logic

Don't use when:
- ❌ Data is already in the shape you need (no mapping required)
- ❌ Logic is truly one-off and won't be reused
- ❌ The component is trivial (e.g., a simple button)

## References

- [Modularizing React Applications](https://martinfowler.com/articles/modularizing-react-apps.html) - See "Domain Models" section
- Skill: `skills/frontend-architecture/react-domain-models/`
