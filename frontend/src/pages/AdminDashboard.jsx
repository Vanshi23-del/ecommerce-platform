import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    api.get('/orders/stats').then((res) => setStats(res.data));
    api.get('/orders/all').then((res) => setOrders(res.data.orders));
    api.get('/auth/users').then((res) => setUsers(res.data.users));
  }, []);

  async function changeRole(id, role) {
    await api.patch(`/auth/users/${id}/role`, { role });
    const res = await api.get('/auth/users');
    setUsers(res.data.users);
  }

  return (
    <div className="container">
      <h1 className="page-title" style={{ marginTop: 24 }}>Admin dashboard</h1>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total sales</div>
            <div className="stat-value">₹{Number(stats.totalSales).toFixed(2)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total orders</div>
            <div className="stat-value">{stats.totalOrders}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total users</div>
            <div className="stat-value">{stats.totalUsers}</div>
          </div>
        </div>
      )}

      <div className="tab-row">
        <button className={`tab-btn${tab === 'overview' ? ' active' : ''}`} onClick={() => setTab('overview')}>
          All orders
        </button>
        <button className={`tab-btn${tab === 'users' ? ' active' : ''}`} onClick={() => setTab('users')}>
          Users & roles
        </button>
      </div>

      {tab === 'overview' && (
        <table className="data-table">
          <thead>
            <tr><th>Order</th><th>Buyer</th><th>Total</th><th>Status</th><th>Date</th></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>#{o.id}</td>
                <td>{o.buyer_name} ({o.buyer_email})</td>
                <td>₹{Number(o.total_amount).toFixed(2)}</td>
                <td>{o.status}</td>
                <td>{new Date(o.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'users' && (
        <table className="data-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th></th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td><span className={`role-badge ${u.role}`}>{u.role}</span></td>
                <td>
                  <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}>
                    <option value="user">user</option>
                    <option value="sales_person">sales_person</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
