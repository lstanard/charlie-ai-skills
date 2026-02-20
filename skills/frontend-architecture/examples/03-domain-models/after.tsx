// AFTER: Component uses domain model; business logic is encapsulated

import { useEffect, useState } from 'react';
import { PaymentMethod } from './payment-method';

export function PaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/payment-methods')
      .then(res => res.json())
      .then(data => {
        // Convert API data to domain models
        setMethods(PaymentMethod.fromAPIList(data));
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Payment Methods</h2>
      <ul>
        {methods.map(method => (
          <li key={method.id}>
            <span>{method.label}</span>
            {method.isDefault && <span className="badge">Default</span>}
            {method.canDelete && (
              <button onClick={() => handleDelete(method.id)}>Delete</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );

  function handleDelete(id: string) {
    // Delete logic
  }
}

// IMPROVEMENTS:
// 1. Component is just presentation - reads from domain model
// 2. No mapping logic in JSX
// 3. No business rules in conditionals
// 4. Easy to test PaymentMethod class independently
// 5. Can reuse PaymentMethod in other components (e.g., checkout summary)
// 6. Changing label format only requires editing PaymentMethod class
