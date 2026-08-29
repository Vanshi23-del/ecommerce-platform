import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const { user } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [payingId, setPayingId] = useState(null);

  useEffect(() => {
    cart.refresh();
  }, []);

  const total = cart.items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);

  async function updateQty(cartItemId, quantity) {
    if (quantity < 1) return;
    await api.patch(`/cart/${cartItemId}`, { quantity });
    await cart.refresh();
  }

  async function removeItem(cartItemId) {
    await api.delete(`/cart/${cartItemId}`);
    await cart.refresh();
  }

  async function checkout() {
    setError('');
    try {
      const { data } = await api.post('/payments/create-order');

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'Marketstall',
        description: 'Order payment (test mode)',
        order_id: data.razorpayOrderId,
        handler: async function (response) {
          setPayingId(data.orderId);
          try {
            await api.post('/payments/verify', {
              orderId: data.orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            await cart.refresh();
            navigate('/orders');
          } catch (err) {
            setError('Payment could not be verified. Please contact support if you were charged.');
          } finally {
            setPayingId(null);
          }
        },
        prefill: { name: user.name, email: user.email },
        theme: { color: '#c1440e' },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => setError('Payment failed or was cancelled.'));
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not start checkout.');
    }
  }

  return (
    <div className="container">
      <h1 className="page-title" style={{ marginTop: 24 }}>Your cart</h1>

      {error && <div className="error-banner">{error}</div>}

      {cart.items.length === 0 ? (
        <div className="empty-state">
          <div className="emoji">🛒</div>
          <p>Your cart is empty.</p>
        </div>
      ) : (
        <div className="card-panel">
          {cart.items.map((item) => (
            <div className="line-item" key={item.cart_item_id}>
              <div className="line-item-thumb">
                {item.image_url && <img src={item.image_url} alt={item.name} />}
              </div>
              <div className="line-item-info">
                <div style={{ fontWeight: 600 }}>{item.name}</div>
                <div className="product-price">₹{Number(item.price).toFixed(2)}</div>
              </div>
              <div className="qty-control">
                <button onClick={() => updateQty(item.cart_item_id, item.quantity - 1)}>−</button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQty(item.cart_item_id, item.quantity + 1)}>+</button>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => removeItem(item.cart_item_id)}>
                Remove
              </button>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
            <div>
              <div className="stat-label">Total</div>
              <div className="stat-value">₹{total.toFixed(2)}</div>
            </div>
            <button className="btn btn-primary" onClick={checkout} disabled={payingId !== null}>
              {payingId ? 'Verifying payment…' : 'Checkout with Razorpay'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
