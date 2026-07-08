import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/Button';

export default function Login() {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Por favor completá todos los campos.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      const status = err.response?.status;
      if (status === 401 || status === 400) {
        setError('Usuario, email o contraseña incorrectos.');
      } else if (status === 404) {
        setError('Usuario no encontrado.');
      } else if (!err.response) {
        setError('No se puede conectar con el servidor. Verificá que esté encendido.');
      } else {
        setError('Error inesperado. Intentá de nuevo.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-blob blob-1" />
        <div className="login-blob blob-2" />
      </div>

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="logo-icon">⚡</div>
          <h1 className="logo-title">PresuApp</h1>
          <p className="logo-subtitle">
            Gestión profesional de presupuestos
          </p>
        </div>

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Usuario o Email
            </label>
            <input
              id="email"
              name="email"
              type="text"
              className="form-input"
              placeholder="juangarcia o tu@email.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="alert alert-error" role="alert">
              <span className="alert-icon">⚠️</span>
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={submitting}
          >
            Ingresar
          </Button>
        </form>

        {/* Link to Register */}
        <div className="auth-switch">
          ¿No tenés cuenta?{' '}
          <Link to="/register" className="auth-switch-link">
            Registrate gratis
          </Link>
        </div>

        <p className="login-footer">PresuApp © {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}
