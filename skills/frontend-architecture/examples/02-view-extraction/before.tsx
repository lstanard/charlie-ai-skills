// BEFORE: Large component with mixed concerns
// Problems: Hard to test, hard to understand, everything in one place

import { useState, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
  category: string;
}

export function ProductList() {
  // State management
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price'>('name');

  // Data fetching
  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      });
  }, []);

  // Derived state / filtering logic
  const filteredProducts = products
    .filter(
      product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (selectedCategory === 'all' || product.category === selectedCategory)
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else {
        return a.price - b.price;
      }
    });

  const categories = ['all', ...new Set(products.map(p => p.category))];
  const totalInStock = filteredProducts.filter(p => p.inStock).length;

  if (loading) {
    return <div>Loading products...</div>;
  }

  return (
    <div className="product-list">
      <div className="header">
        <h1>Products ({filteredProducts.length})</h1>
        <p>{totalInStock} in stock</p>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />

        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Categories' : cat}
            </option>
          ))}
        </select>

        <div className="sort-buttons">
          <button
            className={sortBy === 'name' ? 'active' : ''}
            onClick={() => setSortBy('name')}
          >
            Sort by Name
          </button>
          <button
            className={sortBy === 'price' ? 'active' : ''}
            onClick={() => setSortBy('price')}
          >
            Sort by Price
          </button>
        </div>
      </div>

      <div className="products">
        {filteredProducts.length === 0 ? (
          <p>No products found</p>
        ) : (
          <ul>
            {filteredProducts.map(product => (
              <li key={product.id}>
                <div className="product-card">
                  <h3>{product.name}</h3>
                  <p className="price">${product.price.toFixed(2)}</p>
                  <p className="category">{product.category}</p>
                  {product.inStock ? (
                    <span className="badge in-stock">In Stock</span>
                  ) : (
                    <span className="badge out-of-stock">Out of Stock</span>
                  )}
                  <button
                    disabled={!product.inStock}
                    onClick={() => console.log('Add to cart:', product.id)}
                  >
                    Add to Cart
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// PROBLEMS:
// 1. Component is 100+ lines - hard to understand at a glance
// 2. Filtering/sorting logic embedded in component
// 3. Product card rendering is inline (hard to test independently)
// 4. Filters UI is inline (hard to reuse)
// 5. Hard to test: must render entire component to test filtering logic
// 6. Everything is tightly coupled
