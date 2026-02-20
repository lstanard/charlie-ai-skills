// BEFORE: Scattered conditionals for discount logic
// Problems: Shotgun surgery, hard to add new discount types

import { useState } from 'react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

type DiscountType = 'percentage' | 'fixed' | 'bogo' | 'tiered';

interface Discount {
  type: DiscountType;
  value?: number; // For percentage (e.g., 20) or fixed (e.g., 10.00)
  minQuantity?: number; // For BOGO or tiered
  tierThresholds?: { quantity: number; discount: number }[]; // For tiered
}

export function ShoppingCart() {
  const [items] = useState<CartItem[]>([
    { id: '1', name: 'Laptop', price: 1000, quantity: 2 },
    { id: '2', name: 'Mouse', price: 50, quantity: 4 },
  ]);

  const [discount] = useState<Discount>({
    type: 'percentage',
    value: 20,
  });

  // PROBLEM: Discount logic scattered in conditionals
  const calculateTotal = () => {
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    let discountAmount = 0;

    // Different logic for each discount type
    if (discount.type === 'percentage') {
      discountAmount = subtotal * ((discount.value || 0) / 100);
    } else if (discount.type === 'fixed') {
      discountAmount = discount.value || 0;
    } else if (discount.type === 'bogo') {
      // Buy-one-get-one: for each pair, discount the cheaper item
      items.forEach(item => {
        const pairs = Math.floor(item.quantity / 2);
        discountAmount += pairs * item.price;
      });
    } else if (discount.type === 'tiered') {
      // Tiered: discount based on total quantity
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      const tier = discount.tierThresholds
        ?.reverse()
        .find(t => totalQuantity >= t.quantity);
      if (tier) {
        discountAmount = subtotal * (tier.discount / 100);
      }
    }

    return {
      subtotal,
      discountAmount,
      total: subtotal - discountAmount,
    };
  };

  // PROBLEM: Display logic also has conditionals
  const getDiscountLabel = () => {
    if (discount.type === 'percentage') {
      return `${discount.value}% off`;
    } else if (discount.type === 'fixed') {
      return `$${discount.value} off`;
    } else if (discount.type === 'bogo') {
      return 'Buy One Get One Free';
    } else if (discount.type === 'tiered') {
      return 'Volume Discount';
    }
    return 'No discount';
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
          Discount ({getDiscountLabel()}): -${discountAmount.toFixed(2)}
        </p>
        <p>
          <strong>Total: ${total.toFixed(2)}</strong>
        </p>
      </div>
    </div>
  );
}

// PROBLEMS:
// 1. Shotgun surgery: Adding a new discount type requires editing multiple places
//    - calculateTotal() conditionals
//    - getDiscountLabel() conditionals
//    - Discount interface (add new fields)
// 2. Hard to test: must test all conditionals in one function
// 3. Violates Open/Closed: can't add new discount types without modifying existing code
// 4. Risk of bugs: easy to forget updating one conditional branch
