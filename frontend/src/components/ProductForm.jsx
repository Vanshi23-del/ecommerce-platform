import { useState } from 'react';

export default function ProductForm({ initial, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    description: initial?.description || '',
    price: initial?.price || '',
    category: initial?.category || '',
    stock: initial?.stock ?? 0,
  });
  const [file, setFile] = useState(null);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => data.append(k, v));
    if (file) data.append('image', file);
    onSubmit(data);
  }

  return (
    <form onSubmit={handleSubmit} className="card-panel">
      <div className="form-grid">
        <div className="field">
          <label>Product name</label>
          <input value={form.name} onChange={(e) => update('name', e.target.value)} required />
        </div>
        <div className="field">
          <label>Category</label>
          <input value={form.category} onChange={(e) => update('category', e.target.value)} required />
        </div>
      </div>

      <div className="field">
        <label>Description</label>
        <textarea rows={3} value={form.description} onChange={(e) => update('description', e.target.value)} />
      </div>

      <div className="form-grid">
        <div className="field">
          <label>Price (₹)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.price}
            onChange={(e) => update('price', e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label>Stock</label>
          <input
            type="number"
            min="0"
            value={form.stock}
            onChange={(e) => update('stock', e.target.value)}
          />
        </div>
      </div>

      <div className="field">
        <label>Product image {initial ? '(leave blank to keep current)' : ''}</label>
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
        <p className="helper-text">Uploaded directly to Cloudinary — only the resulting URL is stored.</p>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : initial ? 'Save changes' : 'Add product'}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-outline" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
