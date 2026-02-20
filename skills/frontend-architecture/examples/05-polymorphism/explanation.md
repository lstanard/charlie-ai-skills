# Polymorphism Pattern: Discount Rules Example

This example demonstrates using the **Strategy pattern** (polymorphism) to replace scattered conditionals with pluggable strategies.

## Problem

In `before.tsx`, discount logic is implemented with conditionals:
- ❌ `if (discount.type === 'percentage')` ... `else if (discount.type === 'fixed')` ... etc.
- ❌ Adding a new discount type requires editing multiple functions:
  - `calculateTotal()` - add new calculation branch
  - `getDiscountLabel()` - add new label branch
  - `Discount` interface - add new fields
- ❌ Shotgun surgery: change in multiple places, high risk of bugs
- ❌ Violates Open/Closed Principle: must modify existing code to extend

## Solution: Strategy Pattern

Create a `DiscountStrategy` interface (`discount-strategies.ts`):
```ts
interface DiscountStrategy {
  calculate(items: CartItem[]): number;
  getLabel(): string;
}
```

Implement concrete strategies:
- `PercentageDiscount`
- `FixedDiscount`
- `BOGODiscount`
- `TieredDiscount`
- `SeasonalDiscount` (easy to add!)

The component (`after.tsx`) uses the strategy:
```ts
const discountAmount = discountStrategy.calculate(items);
const label = discountStrategy.getLabel();
```

No conditionals, just delegation.

## Adding a New Discount Type

**Before (with conditionals):**
1. Edit `calculateTotal()` - add `else if (discount.type === 'newtype')`
2. Edit `getDiscountLabel()` - add `else if (discount.type === 'newtype')`
3. Edit `Discount` interface - add new optional fields
4. Risk: forget one place, introduce bug

**After (with strategies):**
1. Create new class:
```ts
export class NewDiscount implements DiscountStrategy {
  calculate(items: CartItem[]): number {
    // New discount logic
  }
  getLabel(): string {
    return 'New Discount';
  }
}
```
2. That's it! Component unchanged.

## Testing

**Before (monolithic):**
```ts
// Must test all conditionals in one function
expect(calculateTotal(items, { type: 'percentage', value: 20 })).toBe(...);
expect(calculateTotal(items, { type: 'fixed', value: 10 })).toBe(...);
expect(calculateTotal(items, { type: 'bogo' })).toBe(...);
// Complex, brittle
```

**After (strategies):**
```ts
// Test each strategy independently
const strategy = new PercentageDiscount(20);
expect(strategy.calculate(items)).toBe(400);
expect(strategy.getLabel()).toBe('20% off');

// Test component with mock strategy
const mockStrategy: DiscountStrategy = {
  calculate: jest.fn().mockReturnValue(100),
  getLabel: jest.fn().mockReturnValue('Test Discount'),
};
render(<ShoppingCart discountStrategy={mockStrategy} />);
expect(screen.getByText('Test Discount')).toBeInTheDocument();
```

Clean, focused, testable.

## When to Use Polymorphism

**Use polymorphism/strategy when:**
- ✅ You have multiple variants of an algorithm (discount types, payment methods, notification strategies)
- ✅ Variants are added frequently (new discount types, new report formats)
- ✅ Each variant has complex logic (not just a simple value difference)
- ✅ You want to avoid shotgun surgery (change in one place, not many)

**Don't use when:**
- ❌ Only 2-3 simple variants that rarely change (a switch statement is fine)
- ❌ Variants are just data differences, not behavior (use configuration instead)
- ❌ Over-engineering a simple problem (don't create 10 classes for a trivial conditional)

## Advanced: Runtime Strategy Selection

Strategies can be selected at runtime based on user input, API response, or configuration:

```ts
// From user selection
function DiscountSelector({ onSelect }: Props) {
  const strategies = [
    { id: 'pct20', label: '20% off', strategy: new PercentageDiscount(20) },
    { id: 'fixed10', label: '$10 off', strategy: new FixedDiscount(10) },
    { id: 'bogo', label: 'BOGO', strategy: new BOGODiscount() },
  ];

  return (
    <select onChange={e => {
      const selected = strategies.find(s => s.id === e.target.value);
      onSelect(selected.strategy);
    }}>
      {strategies.map(s => (
        <option key={s.id} value={s.id}>{s.label}</option>
      ))}
    </select>
  );
}

// From API response
async function loadDiscount(): Promise<DiscountStrategy> {
  const config = await fetch('/api/discount-config').then(r => r.json());
  return createDiscountStrategy(config); // Factory function
}
```

## Real-World Examples

Where polymorphism shines:
- **Payment methods**: CreditCard, PayPal, ApplePay, Crypto
- **Notification strategies**: Email, SMS, Push, Slack
- **Export formats**: PDF, CSV, Excel, JSON
- **Validation rules**: Required, Email, PhoneNumber, CustomRegex
- **Rendering modes**: GridView, ListView, CardView

All follow the same pattern:
1. Define interface (strategy)
2. Implement variants (concrete strategies)
3. Inject strategy into component
4. Add new variants without editing components

## References

- [Strategy Pattern (Refactoring Guru)](https://refactoring.guru/design-patterns/strategy)
- [Modularizing React Applications](https://martinfowler.com/articles/modularizing-react-apps.html) - See "Polymorphism" section
- Skill: `skills/frontend-architecture/react-polymorphism/`
- [Open/Closed Principle (SOLID)](https://en.wikipedia.org/wiki/Open%E2%80%93closed_principle)
