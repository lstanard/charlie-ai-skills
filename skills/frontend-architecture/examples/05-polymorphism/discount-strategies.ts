// Strategy pattern: Each discount type is a separate class
// Adding new discount types doesn't require editing existing code

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

// Strategy interface
export interface DiscountStrategy {
  calculate(items: CartItem[]): number;
  getLabel(): string;
}

// Concrete strategy: Percentage discount
export class PercentageDiscount implements DiscountStrategy {
  constructor(private percentage: number) {}

  calculate(items: CartItem[]): number {
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    return subtotal * (this.percentage / 100);
  }

  getLabel(): string {
    return `${this.percentage}% off`;
  }
}

// Concrete strategy: Fixed amount discount
export class FixedDiscount implements DiscountStrategy {
  constructor(private amount: number) {}

  calculate(items: CartItem[]): number {
    return this.amount;
  }

  getLabel(): string {
    return `$${this.amount} off`;
  }
}

// Concrete strategy: Buy-one-get-one
export class BOGODiscount implements DiscountStrategy {
  calculate(items: CartItem[]): number {
    let discount = 0;
    items.forEach(item => {
      const pairs = Math.floor(item.quantity / 2);
      discount += pairs * item.price;
    });
    return discount;
  }

  getLabel(): string {
    return 'Buy One Get One Free';
  }
}

// Concrete strategy: Tiered discount
export class TieredDiscount implements DiscountStrategy {
  constructor(
    private tiers: { quantity: number; discount: number }[]
  ) {
    // Sort tiers by quantity descending for easy lookup
    this.tiers = [...tiers].sort((a, b) => b.quantity - a.quantity);
  }

  calculate(items: CartItem[]): number {
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

    const tier = this.tiers.find(t => totalQuantity >= t.quantity);
    if (!tier) return 0;

    return subtotal * (tier.discount / 100);
  }

  getLabel(): string {
    return 'Volume Discount';
  }
}

// NEW STRATEGY: Easy to add without touching existing code!
export class SeasonalDiscount implements DiscountStrategy {
  constructor(
    private percentage: number,
    private season: string
  ) {}

  calculate(items: CartItem[]): number {
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    return subtotal * (this.percentage / 100);
  }

  getLabel(): string {
    return `${this.season} Sale - ${this.percentage}% off`;
  }
}

// Factory function to create strategies from config
export function createDiscountStrategy(config: {
  type: string;
  percentage?: number;
  amount?: number;
  tiers?: { quantity: number; discount: number }[];
  season?: string;
}): DiscountStrategy {
  switch (config.type) {
    case 'percentage':
      return new PercentageDiscount(config.percentage || 0);
    case 'fixed':
      return new FixedDiscount(config.amount || 0);
    case 'bogo':
      return new BOGODiscount();
    case 'tiered':
      return new TieredDiscount(config.tiers || []);
    case 'seasonal':
      return new SeasonalDiscount(config.percentage || 0, config.season || '');
    default:
      throw new Error(`Unknown discount type: ${config.type}`);
  }
}

// BENEFITS:
// 1. Open/Closed Principle: Open for extension, closed for modification
// 2. Single Responsibility: Each class handles one discount type
// 3. Easy to test: Test each strategy independently
// 4. No shotgun surgery: Add new strategies without editing existing ones
// 5. Type-safe: Each strategy guarantees calculate() and getLabel()
