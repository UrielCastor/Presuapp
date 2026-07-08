import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import axiosInstance from '../api/axios';
import Button from '../components/Button';

export default function Register() {
  const { isAuthenticated, loading, login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    username: '',
    city: '',
    locality: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email || !form.password) {
      setError('Por favor completá todos los campos obligatorios.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      setError('El correo electrónico ingresado no es válido.');
      return;
    }

    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await axiosInstance.post('/auth/register', {
        name: form.name.trim(),
        email: form.email,
        password: form.password,
        username: form.username.trim(),
        city: form.city.trim(),
        locality: form.locality.trim(),
      });

      // Auto-login after successful registration
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || '';

      if (status === 409 || msg.toLowerCase().includes('exist') || msg.toLowerCase().includes('registrado')) {
        setError(msg || 'Ya existe una cuenta con ese email o nombre de usuario.');
      } else if (status === 400) {
        setError(msg || 'Datos inválidos. Verificá los campos.');
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

      <div className="login-card" style={{ maxWidth: '480px' }}>
        {/* Logo */}
        <div className="login-logo">
          <div className="logo-icon">⚡</div>
          <h1 className="logo-title">PresuApp</h1>
          <p className="logo-subtitle">Creá tu cuenta profesional</p>
        </div>

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">
              Nombre completo *
            </label>
            <input
              id="reg-name"
              name="name"
              type="text"
              className="form-input"
              placeholder="Juan García"
              value={form.name}
              onChange={handleChange}
              autoComplete="name"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">
              Email *
            </label>
            <input
              id="reg-email"
              name="email"
              type="email"
              className="form-input"
              placeholder="tu@email.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-username">
              Nombre de usuario <span className="form-hint">(opcional)</span>
            </label>
            <input
              id="reg-username"
              name="username"
              type="text"
              className="form-input"
              placeholder="juangarcia"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
            />
          </div>

          <div className="register-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-city">
                Ciudad
              </label>
              <input
                id="reg-city"
                name="city"
                type="text"
                className="form-input"
                placeholder="Ej: Buenos Aires"
                value={form.city}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-locality">
                Localidad
              </label>
              <input
                id="reg-locality"
                name="locality"
                type="text"
                className="form-input"
                placeholder="Ej: Palermo"
                value={form.locality}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">
              Contraseña * <span className="form-hint">(mín. 6 caracteres)</span>
            </label>
            <input
              id="reg-password"
              name="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-confirm">
              Confirmar contraseña *
            </label>
            <input
              id="reg-confirm"
              name="confirmPassword"
              type="password"
              className={`form-input ${
                form.confirmPassword && form.password !== form.confirmPassword
                  ? 'input-error'
                  : ''
              }`}
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
            />
            {form.confirmPassword && form.password !== form.confirmPassword && (
              <p className="field-error-msg">Las contraseñas no coinciden</p>
            )}
          </div>

          {error && (
            <div className="alert alert-error" role="alert">
              <span className="alert-icon">⚠️</span>
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success" role="alert">
              <span className="alert-icon">✅</span>
              {success}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={submitting}
          >
            Crear cuenta
          </Button>
        </form>

        {/* Link to Login */}
        <div className="auth-switch">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="auth-switch-link">
            Iniciá sesión
          </Link>
        </div>

        <p className="login-footer">PresuApp © {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}
