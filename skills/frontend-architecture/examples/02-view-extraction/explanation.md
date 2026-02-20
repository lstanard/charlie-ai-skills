# View Extraction Pattern: Product List Example

This example demonstrates how to **extract hooks and sub-components** from a large monolithic component to achieve better testability, reusability, and clarity.

## Problem

In `before.tsx`, a single component (100+ lines) handles:
- ❌ Data fetching
- ❌ State management (search, category, sort)
- ❌ Filtering and sorting logic
- ❌ Rendering header, filters, and product cards
- ❌ Event handling

This makes the component:
- Hard to test (must render entire component to test filtering)
- Hard to understand (too much in one place)
- Hard to reuse (product card can't be used elsewhere)
- Hard to maintain (changes to one part affect the whole)

## Solution: Two-Step Extraction

### Step 1: Extract hooks (`after-hooks.tsx`)

Move state and logic into custom hooks:
- **`useProducts()`** - Fetches products, manages loading state
- **`useProductFilters(products)`** - Manages search, category, sort; computes filtered list

**Benefits:**
- ✅ Logic is testable with `@testing-library/react-hooks`
- ✅ Hooks are reusable in other components (e.g., admin panel, mobile view)
- ✅ Component focuses on rendering

**Testing:**
```ts
const { result } = renderHook(() => useProductFilters(mockProducts));

act(() => {
  result.current.setSearchTerm('laptop');
});

expect(result.current.filteredProducts).toHaveLength(2);
```

### Step 2: Extract sub-components (`after-components.tsx`)

Break rendering into focused components:
- **`ProductHeader`** - Displays total counts (pure, easily testable)
- **`ProductFilters`** - Search, category dropdown, sort buttons (reusable)
- **`ProductCard`** - Individual product display (testable independently)

**Benefits:**
- ✅ Each component has a single responsibility
- ✅ ProductCard can be tested without rendering the entire list
- ✅ ProductFilters can be reused in other views
- ✅ Main component is just composition (easy to understand)

**Testing:**
```tsx
// Test ProductCard independently
render(<ProductCard product={mockProduct} onAddToCart={mockHandler} />);
expect(screen.getByText('Laptop')).toBeInTheDocument();
expect(screen.getByText('$999.99')).toBeInTheDocument();

// Test ProductFilters independently
render(<ProductFilters {...mockFiltersProps} />);
const searchInput = screen.getByPlaceholderText('Search products...');
fireEvent.change(searchInput, { target: { value: 'laptop' } });
expect(mockOnSearchChange).toHaveBeenCalledWith('laptop');
```

## Component Composition Pattern

The main component becomes pure composition:

```tsx
export function ProductList() {
  const { products, loading } = useProducts();
  const filters = useProductFilters(products);

  return (
    <div>
      <ProductHeader {...} />
      <ProductFilters {...} />
      <ProductCards products={filters.filteredProducts} />
    </div>
  );
}
```

This is the **ideal structure**: the parent just orchestrates, each child is independent.

## When to Extract

### Extract hooks when:
- ✅ Component has complex state management
- ✅ Logic needs to be reused in multiple components
- ✅ You want to test logic without rendering

### Extract components when:
- ✅ A section of JSX is self-contained (has its own responsibility)
- ✅ Component is getting large (>100 lines)
- ✅ You want to test a piece of UI independently
- ✅ You want to reuse UI across components

### Don't extract when:
- ❌ Component is already simple and focused
- ❌ Extraction would create trivial one-liner components
- ❌ The "sub-component" is tightly coupled to the parent (no real separation)

## Prefer Pure Presentational Components

Notice how `ProductCard`, `ProductHeader`, and `ProductFilters` are **pure functions**:
- No hooks (useState, useEffect)
- Just props in, JSX out
- Easier to test, reason about, and optimize

**Pattern:**
```tsx
// Pure presentational component (preferred)
function ProductCard({ product, onAddToCart }: Props) {
  return <div>{product.name}...</div>;
}

// Avoid: component with side effects
function ProductCard({ productId }: Props) {
  const [product, setProduct] = useState(null);
  useEffect(() => {
    fetch(`/api/products/${productId}`).then(...);
  }, [productId]);
  // ...
}
```

Push state and effects up to the parent or into custom hooks. Keep components pure.

## References

- [Modularizing React Applications](https://martinfowler.com/articles/modularizing-react-apps.html) - See "View Extraction" section
- Skill: `skills/frontend-architecture/react-view-extraction/`
- [React Hooks for Managing State](https://react.dev/learn/reusing-logic-with-custom-hooks)
