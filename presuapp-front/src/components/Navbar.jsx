import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const navLinks = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/clients', label: 'Clientes', icon: '👥' },
  { path: '/items', label: 'Servicios', icon: '🔧' },
  { path: '/professions', label: 'Profesiones', icon: '🏅' },
  { path: '/budgets', label: 'Presupuestos', icon: '📋' },
  { path: '/profile', label: 'Mi Perfil', icon: '👤' },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          {/* Brand */}
          <NavLink to="/dashboard" className="navbar-brand" onClick={closeMenu}>
            <span className="brand-icon">⚡</span>
            <span className="brand-text">PresuApp</span>
          </NavLink>

          <ul className="navbar-links">
            {navLinks.map((link) => (
              <li key={link.path}>
                <NavLink
                  to={link.path}
                  className={({ isActive }) =>
                    `navbar-link ${isActive ? 'active' : ''}`
                  }
                >
                  <span className="link-icon">{link.icon}</span>
                  {link.label}
                </NavLink>
              </li>
            ))}
            {user?.role === 'ADMIN' && (
              <li>
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `navbar-link ${isActive ? 'active' : ''}`
                  }
                  style={{ border: '1px dashed rgba(99, 102, 241, 0.4)', borderRadius: '6px' }}
                >
                  <span className="link-icon">⚙️</span>
                  Admin
                </NavLink>
              </li>
            )}
          </ul>

          {/* Desktop user area */}
          <div className="navbar-user">
            <span className="user-greeting">
              Hola, <strong>{user?.name || user?.email?.split('@')[0] || 'Usuario'}</strong>
            </span>
            <button className="btn-logout" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>

          {/* Hamburger */}
          <button
            className={`hamburger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Menú"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div
        className={`mobile-drawer ${menuOpen ? 'open' : ''}`}
        onClick={closeMenu}
      >
        <div
          className="mobile-drawer-inner"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="drawer-header">
            <span className="brand-icon">⚡</span>
            <span className="brand-text">PresuApp</span>
            <button
              className="drawer-close"
              onClick={closeMenu}
              aria-label="Cerrar menú"
            >
              ✕
            </button>
          </div>

          <div className="drawer-user">
            <div className="drawer-avatar">
              {(user?.name || user?.email || 'U')[0].toUpperCase()}
            </div>
            <span>{user?.name || user?.email || 'Usuario'}</span>
          </div>

          <ul className="drawer-links">
            {navLinks.map((link) => (
              <li key={link.path}>
                <NavLink
                  to={link.path}
                  className={({ isActive }) =>
                    `drawer-link ${isActive ? 'active' : ''}`
                  }
                  onClick={closeMenu}
                >
                  <span className="link-icon">{link.icon}</span>
                  {link.label}
                </NavLink>
              </li>
            ))}
            {user?.role === 'ADMIN' && (
              <li>
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `drawer-link ${isActive ? 'active' : ''}`
                  }
                  onClick={closeMenu}
                  style={{ borderLeft: '3px solid var(--brand-primary)', paddingLeft: '8px' }}
                >
                  <span className="link-icon">⚙️</span>
                  Consola Admin
                </NavLink>
              </li>
            )}
          </ul>

          <div className="drawer-footer">
            <button className="btn-logout-mobile" onClick={handleLogout}>
              🚪 Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {menuOpen && (
        <div className="drawer-overlay" onClick={closeMenu} />
      )}
    </>
  );
}
