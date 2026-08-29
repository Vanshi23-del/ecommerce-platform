import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import ProductList from './pages/ProductList';
import Login from './pages/Login';
import Register from './pages/Register';
import ProductManage from './pages/ProductManage';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Orders from './pages/Orders';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <div className="app-shell">
            <Navbar />
            <main className="page">
              <Routes>
                <Route path="/" element={<ProductList />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/manage"
                  element={
                    <ProtectedRoute roles={['admin', 'sales_person']}>
                      <ProductManage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/cart"
                  element={
                    <ProtectedRoute roles={['user']}>
                      <Cart />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/wishlist"
                  element={
                    <ProtectedRoute>
                      <Wishlist />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute>
                      <Orders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute roles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>
            <footer className="app-footer">Marketstall — role-based e-commerce assessment build</footer>
          </div>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
