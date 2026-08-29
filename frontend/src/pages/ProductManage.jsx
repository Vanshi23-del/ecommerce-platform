import { useEffect, useState } from 'react';
import api from '../api/axios';
import ProductForm from '../components/ProductForm';
import { useAuth } from '../context/AuthContext';

export default function ProductManage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null); // null = not adding, 'new' = adding, product = editing
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const res = await api.get('/products/mine');
    setProducts(res.data.products);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(formData) {
    setSubmitting(true);
    setError('');
    try {
      if (editing === 'new') {
        await api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.put(`/products/${editing.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setEditing(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save product.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    await api.delete(`/products/${id}`);
    await load();
  }

  return (
    <div className="container">
      <div className="section-header">
        <h2>
          {user.role === 'admin' ? 'My listings' : 'My products'}{' '}
          <span className={`role-badge ${user.role}`}>{user.role === 'admin' ? 'Admin' : 'Sales'}</span>
        </h2>
        {!editing && (
          <button className="btn btn-primary" onClick={() => setEditing('new')}>
            + Add product
          </button>
        )}
      </div>

      <p className="helper-text" style={{ marginBottom: 16 }}>
        {user.role === 'admin'
          ? 'Admins can manage any product platform-wide via the API; this view shows products you personally created.'
          : 'You can only add, edit, or delete products you created — enforced on the backend regardless of what the UI shows.'}
      </p>

      {error && <div className="error-banner">{error}</div>}

      {editing && (
        <div style={{ marginBottom: 28 }}>
          <ProductForm
            initial={editing === 'new' ? null : editing}
            onSubmit={handleSubmit}
            onCancel={() => setEditing(null)}
            submitting={submitting}
          />
        </div>
      )}

      {products.length === 0 ? (
        <div className="empty-state">
          <div className="emoji">📦</div>
          <p>No products yet — add your first one.</p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.category}</td>
                <td>₹{Number(p.price).toFixed(2)}</td>
                <td>{p.stock}</td>
                <td style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-outline btn-sm" onClick={() => setEditing(p)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
