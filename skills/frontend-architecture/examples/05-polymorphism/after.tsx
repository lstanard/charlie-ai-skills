// AFTER: Using strategy pattern
// Improvement: Adding new discount types doesn't require editing this component

import { useState } from 'react';
import {
  DiscountStrategy,
  PercentageDiscount,
} from './discount-strategies';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export function ShoppingCart() {
  const [items] = useState<CartItem[]>([
    { id: '1', name: 'Laptop', price: 1000, quantity: 2 },
    { id: '2', name: 'Mouse', price: 50, quantity: 4 },
  ]);

  // Strategy is injected (could come from API, user selection, etc.)
  const [discountStrategy] = useState<DiscountStrategy>(
    new PercentageDiscount(20)
  );

  const calculateTotal = () => {
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Delegate to strategy
    const discountAmount = discountStrategy.calculate(items);

    return {
      subtotal,
      discountAmount,
      total: subtotal - discountAmount,
    };
  };

  const { subtotal, discountAmount, total } = calculateTotal();

  return (
    <div className="cart">
      <h2>Shopping Cart</h2>

      <ul>
        {items.map(item => (
          <li key={item.id}>
            {item.name} - ${item.price} x {item.quantity}
          </li>
        ))}
      </ul>

      <div className="totals">
        <p>Subtotal: ${subtotal.toFixed(2)}</p>
        <p>
          Discount ({discountStrategy.getLabel()}): -$
          {discountAmount.toFixed(2)}
        </p>
        <p>
          <strong>Total: ${total.toFixed(2)}</strong>
        </p>
      </div>
    </div>
  );
}

// IMPROVEMENTS:
// ✅ No conditionals based on discount type
// ✅ Component doesn't know about discount logic
// ✅ Adding new discount type = create new strategy class (no component changes)
// ✅ Easy to test: test strategies independently, mock strategy in component tests
//
// Example: Adding a new discount type
// 1. Create new class: class FreeShippingDiscount implements DiscountStrategy { ... }
// 2. That's it! Component code unchanged.
//
// Example: Testing
// const mockStrategy: DiscountStrategy = {
//   calculate: jest.fn().mockReturnValue(100),
//   getLabel: jest.fn().mockReturnValue('Test Discount'),
// };
// render(<ShoppingCart discountStrategy={mockStrategy} />);
