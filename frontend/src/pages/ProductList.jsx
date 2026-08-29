import { useEffect, useState } from 'react';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function ProductList() {
  const { user } = useAuth();
  const cart = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  useEffect(() => {
    api.get('/products/categories').then((res) => setCategories(res.data.categories));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (q) params.q = q;
    if (category) params.category = category;
    const timeout = setTimeout(() => {
      api
        .get('/products', { params })
        .then((res) => setProducts(res.data.products))
        .finally(() => setLoading(false));
    }, 300); // debounce search
    return () => clearTimeout(timeout);
  }, [q, category]);

  async function addToCart(productId) {
    await api.post('/cart', { productId, quantity: 1 });
    await cart.refresh();
    setToast('Added to cart.');
    setTimeout(() => setToast(''), 1500);
  }

  async function addToWishlist(productId) {
    await api.post('/wishlist', { productId });
    setToast('Saved to wishlist.');
    setTimeout(() => setToast(''), 1500);
  }

  return (
    <div className="container">
      <div className="page-title" style={{ marginTop: 24 }}>Browse the marketplace</div>
      <p className="page-subtitle">Search products across every seller on the platform.</p>

      {toast && <div className="success-banner">{toast}</div>}

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search by name or description…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="helper-text">Loading products…</p>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <div className="emoji">🗃️</div>
          <p>No products match your search yet.</p>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              actions={
                user && user.role === 'user' ? (
                  <>
                    <button className="btn btn-primary btn-sm" onClick={() => addToCart(p.id)}>Add to cart</button>
                    <button className="btn btn-outline btn-sm" onClick={() => addToWishlist(p.id)}>♡</button>
                  </>
                ) : !user ? (
                  <span className="helper-text">Log in as a buyer to purchase</span>
                ) : null
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
