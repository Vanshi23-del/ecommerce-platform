import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useCart } from '../context/CartContext';

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const cart = useCart();

  async function load() {
    const res = await api.get('/wishlist');
    setItems(res.data.items);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(wishlistItemId) {
    await api.delete(`/wishlist/${wishlistItemId}`);
    await load();
  }

  async function moveToCart(productId, wishlistItemId) {
    await api.post('/cart', { productId, quantity: 1 });
    await remove(wishlistItemId);
    await cart.refresh();
  }

  return (
    <div className="container">
      <h1 className="page-title" style={{ marginTop: 24 }}>Wishlist</h1>

      {items.length === 0 ? (
        <div className="empty-state">
          <div className="emoji">♡</div>
          <p>Nothing saved yet. Browse products and tap the heart to save them here.</p>
        </div>
      ) : (
        <div className="card-panel">
          {items.map((item) => (
            <div className="line-item" key={item.wishlist_item_id}>
              <div className="line-item-thumb">
                {item.image_url && <img src={item.image_url} alt={item.name} />}
              </div>
              <div className="line-item-info">
                <div style={{ fontWeight: 600 }}>{item.name}</div>
                <div className="product-price">₹{Number(item.price).toFixed(2)}</div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => moveToCart(item.id, item.wishlist_item_id)}>
                Move to cart
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => remove(item.wishlist_item_id)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
