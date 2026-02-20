// Domain model: Encapsulates mapping and business rules

interface PaymentMethodAPI {
  id: string;
  provider: string;
  last4: string | null;
  account_holder: string;
  is_default: boolean;
}

export class PaymentMethod {
  constructor(private data: PaymentMethodAPI) {}

  get id(): string {
    return this.data.id;
  }

  get isDefault(): boolean {
    return this.data.is_default;
  }

  get canDelete(): boolean {
    // Business rule: cash payment methods can't be deleted
    return this.data.provider !== 'cash';
  }

  get label(): string {
    // Mapping logic: API representation -> user-facing label
    switch (this.data.provider) {
      case 'stripe':
        return `Card ending in ${this.data.last4 ?? '****'}`;
      case 'paypal':
        return `PayPal (${this.data.account_holder})`;
      case 'cash':
        return 'Cash';
      default:
        return 'Unknown payment method';
    }
  }

  get provider(): string {
    return this.data.provider;
  }

  // Factory method: convert API data to domain model
  static fromAPI(data: PaymentMethodAPI): PaymentMethod {
    return new PaymentMethod(data);
  }

  // Batch conversion
  static fromAPIList(data: PaymentMethodAPI[]): PaymentMethod[] {
    return data.map(PaymentMethod.fromAPI);
  }
}

// BENEFITS:
// 1. Business logic is testable without React
// 2. Null handling is centralized (last4 ?? '****')
// 3. Easy to reuse across components
// 4. Change the label format in one place
// 5. Type-safe: getters ensure correct property access
