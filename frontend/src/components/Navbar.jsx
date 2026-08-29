import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const ROLE_LABEL = { admin: 'Admin', sales_person: 'Sales', user: 'Buyer' };

export default function Navbar() {
  const { user, logout } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <NavLink to="/" className="brand">
          Market<span className="brand-mark">stall</span>
        </NavLink>

        <nav className="nav-links">
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Browse
          </NavLink>
          {user && (user.role === 'admin' || user.role === 'sales_person') && (
            <NavLink to="/manage" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              My Products
            </NavLink>
          )}
          {user && (
            <NavLink to="/wishlist" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              Wishlist
            </NavLink>
          )}
          {user && (
            <NavLink to="/orders" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              Orders
            </NavLink>
          )}
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              Dashboard
            </NavLink>
          )}
        </nav>

        <div className="nav-right">
          {user ? (
            <>
              <NavLink to="/cart" className="cart-pill">
                Cart
                {cart.count > 0 && <span className="cart-count">{cart.count}</span>}
              </NavLink>
              <span className={`role-badge ${user.role}`}>{ROLE_LABEL[user.role]}</span>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="btn btn-outline btn-sm">
                Log in
              </NavLink>
              <NavLink to="/register" className="btn btn-primary btn-sm">
                Sign up
              </NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
