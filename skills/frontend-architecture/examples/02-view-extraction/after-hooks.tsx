// STEP 1: Extract hooks for state and logic
// Improvement: State and filtering logic separate from rendering

import { useState, useEffect, useMemo } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
  category: string;
}

// Custom hook: Encapsulates product fetching
function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      });
  }, []);

  return { products, loading };
}

// Custom hook: Encapsulates filtering and sorting logic
function useProductFilters(products: Product[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price'>('name');

  const filteredProducts = useMemo(() => {
    return products
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
  }, [products, searchTerm, selectedCategory, sortBy]);

  const categories = useMemo(
    () => ['all', ...new Set(products.map(p => p.category))],
    [products]
  );

  const totalInStock = useMemo(
    () => filteredProducts.filter(p => p.inStock).length,
    [filteredProducts]
  );

  return {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    filteredProducts,
    categories,
    totalInStock,
  };
}

export function ProductList() {
  const { products, loading } = useProducts();
  const {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    filteredProducts,
    categories,
    totalInStock,
  } = useProductFilters(products);

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

// IMPROVEMENTS:
// ✅ State and logic extracted to custom hooks
// ✅ Hooks are testable with @testing-library/react-hooks
// ✅ Hooks are reusable in other components
//
// REMAINING PROBLEMS:
// ❌ Filters UI is still inline (not reusable)
// ❌ Product card is still inline (not testable independently)
