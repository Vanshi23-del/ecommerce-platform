import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(form.name, form.email, form.password, form.role);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container">
      <div className="auth-page card-panel">
        <h1 className="page-title">Create an account</h1>
        <p className="page-subtitle">Join as a buyer, or register as a seller to list products.</p>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Name</label>
            <input value={form.name} onChange={(e) => update('name', e.target.value)} required />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              minLength={6}
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Account type</label>
            <select value={form.role} onChange={(e) => update('role', e.target.value)}>
              <option value="user">Buyer — browse and purchase</option>
              <option value="sales_person">Seller — list and manage products</option>
            </select>
            <p className="helper-text">Admin accounts are created separately by the platform owner.</p>
          </div>
          <button className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Sign up'}
          </button>
        </form>
        <p className="helper-text" style={{ marginTop: 16 }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
