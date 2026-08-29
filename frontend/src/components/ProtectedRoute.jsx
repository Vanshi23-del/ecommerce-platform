import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Frontend gating is a UX convenience only — every real permission check
// happens again on the backend (see backend/src/middleware/roleCheck.js).
// This just avoids showing a page the API would reject anyway.
export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
}
