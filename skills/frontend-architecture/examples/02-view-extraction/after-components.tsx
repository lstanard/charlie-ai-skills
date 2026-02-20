// STEP 2: Extract sub-components
// Improvement: Each component has a single responsibility

import { useState, useEffect, useMemo } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
  category: string;
}

// Custom hooks (same as before)
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

// Extracted component: Product card (testable independently)
interface ProductCardProps {
  product: Product;
  onAddToCart: (id: string) => void;
}

function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
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
        onClick={() => onAddToCart(product.id)}
      >
        Add to Cart
      </button>
    </div>
  );
}

// Extracted component: Filters (reusable)
interface ProductFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
  sortBy: 'name' | 'price';
  onSortChange: (sortBy: 'name' | 'price') => void;
}

function ProductFilters({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  sortBy,
  onSortChange,
}: ProductFiltersProps) {
  return (
    <div className="filters">
      <input
        type="text"
        placeholder="Search products..."
        value={searchTerm}
        onChange={e => onSearchChange(e.target.value)}
      />

      <select
        value={selectedCategory}
        onChange={e => onCategoryChange(e.target.value)}
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
          onClick={() => onSortChange('name')}
        >
          Sort by Name
        </button>
        <button
          className={sortBy === 'price' ? 'active' : ''}
          onClick={() => onSortChange('price')}
        >
          Sort by Price
        </button>
      </div>
    </div>
  );
}

// Extracted component: Header
interface ProductHeaderProps {
  totalProducts: number;
  totalInStock: number;
}

function ProductHeader({ totalProducts, totalInStock }: ProductHeaderProps) {
  return (
    <div className="header">
      <h1>Products ({totalProducts})</h1>
      <p>{totalInStock} in stock</p>
    </div>
  );
}

// Main component: Now just composition
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

  const handleAddToCart = (id: string) => {
    console.log('Add to cart:', id);
  };

  if (loading) {
    return <div>Loading products...</div>;
  }

  return (
    <div className="product-list">
      <ProductHeader
        totalProducts={filteredProducts.length}
        totalInStock={totalInStock}
      />

      <ProductFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      <div className="products">
        {filteredProducts.length === 0 ? (
          <p>No products found</p>
        ) : (
          <ul>
            {filteredProducts.map(product => (
              <li key={product.id}>
                <ProductCard product={product} onAddToCart={handleAddToCart} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// FINAL STATE:
// ✅ Main component is just composition (orchestration)
// ✅ Each sub-component has a single responsibility
// ✅ ProductCard is testable independently
// ✅ ProductFilters is reusable in other views
// ✅ Easy to understand: each component is small and focused
// ✅ Easy to change: modify one component without affecting others
