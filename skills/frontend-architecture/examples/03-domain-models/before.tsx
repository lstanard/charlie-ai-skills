// BEFORE: Mapping logic and business rules scattered in the component

import { useEffect, useState } from 'react';

interface PaymentMethodAPI {
  id: string;
  provider: string;
  last4: string | null;
  account_holder: string;
  is_default: boolean;
}

export function PaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethodAPI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/payment-methods')
      .then(res => res.json())
      .then(data => {
        setMethods(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Payment Methods</h2>
      <ul>
        {methods.map(method => {
          // Business logic: What label should we show?
          const label =
            method.provider === 'stripe'
              ? `Card ending in ${method.last4}`
              : method.provider === 'paypal'
              ? `PayPal (${method.account_holder})`
              : method.provider === 'cash'
              ? 'Cash'
              : 'Unknown payment method';

          // Business logic: Should this show a "default" badge?
          const isDefault = method.is_default;

          // Business logic: Can we delete this method?
          const canDelete = method.provider !== 'cash';

          return (
            <li key={method.id}>
              <span>{label}</span>
              {isDefault && <span className="badge">Default</span>}
              {canDelete && (
                <button onClick={() => handleDelete(method.id)}>Delete</button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );

  function handleDelete(id: string) {
    // Delete logic
  }
}

// PROBLEMS:
// 1. Mapping logic (provider -> label) is in JSX
// 2. Business rules (canDelete, isDefault) are inline conditionals
// 3. Null handling (last4) is scattered
// 4. Hard to test: must render component to test logic
// 5. Hard to reuse: if another component needs payment labels, we duplicate
