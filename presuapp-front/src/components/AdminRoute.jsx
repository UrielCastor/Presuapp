import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function AdminRoute({ children }) {
  const { user, loading, isAuthenticated } = useAuth();

  // Mientras carga la sesión
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  // Si no está autenticado, va a Login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si es un usuario normal (no ADMIN), lo redirige a la sección no autorizado
  if (user && user.role !== 'ADMIN') {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
