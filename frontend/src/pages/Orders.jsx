import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Orders() {
  const { user } = useAuth();
  const [tab, setTab] = useState('mine');
  const [myOrders, setMyOrders] = useState([]);
  const [sellerItems, setSellerItems] = useState([]);
  const canSell = user.role === 'sales_person' || user.role === 'admin';

  useEffect(() => {
    api.get('/orders/mine').then((res) => setMyOrders(res.data.orders));
    if (canSell) {
      api.get('/orders/seller').then((res) => setSellerItems(res.data.items));
    }
  }, []);

  return (
    <div className="container">
      <h1 className="page-title" style={{ marginTop: 24 }}>Orders</h1>

      {canSell && (
        <div className="tab-row">
          <button className={`tab-btn${tab === 'mine' ? ' active' : ''}`} onClick={() => setTab('mine')}>
            My purchases
          </button>
          <button className={`tab-btn${tab === 'selling' ? ' active' : ''}`} onClick={() => setTab('selling')}>
            My sales
          </button>
        </div>
      )}

      {tab === 'mine' && (
        myOrders.length === 0 ? (
          <div className="empty-state">
            <div className="emoji">🧾</div>
            <p>No orders yet.</p>
          </div>
        ) : (
          myOrders.map((order) => (
            <div className="card-panel" key={order.id} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>Order #{order.id}</strong>
                <span className="helper-text">{new Date(order.created_at).toLocaleString()}</span>
              </div>
              <ul>
                {order.items.map((i) => (
                  <li key={i.id}>{i.name} × {i.quantity} — ₹{Number(i.price).toFixed(2)}</li>
                ))}
              </ul>
              <div className="product-price">Total: ₹{Number(order.total_amount).toFixed(2)}</div>
            </div>
          ))
        )
      )}

      {tab === 'selling' && (
        sellerItems.length === 0 ? (
          <div className="empty-state">
            <div className="emoji">📬</div>
            <p>No orders containing your products yet.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Buyer</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {sellerItems.map((i) => (
                <tr key={i.id}>
                  <td>{i.name}</td>
                  <td>{i.buyer_name}</td>
                  <td>{i.quantity}</td>
                  <td>₹{Number(i.price).toFixed(2)}</td>
                  <td>{new Date(i.order_date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}
    </div>
  );
}
