import { createContext, useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axios';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('dark');

  const applyTheme = useCallback((themeName) => {
    const list = ['theme-light', 'theme-dark', 'theme-blue', 'theme-green', 'theme-purple', 'theme-orange', 'theme-black'];
    list.forEach(t => document.documentElement.classList.remove(t));
    document.documentElement.classList.add(`theme-${themeName}`);
  }, []);

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      if (parsedUser && parsedUser.id) {
        const persistedTheme = localStorage.getItem(`presuapp_theme_${parsedUser.id}`) || 'dark';
        setTheme(persistedTheme);
        applyTheme(persistedTheme);
      }
    } else {
      const defaultTheme = localStorage.getItem('presuapp_default_theme') || 'dark';
      setTheme(defaultTheme);
      applyTheme(defaultTheme);
    }
    setLoading(false);
  }, [applyTheme]);

  // Adjust theme on user change
  useEffect(() => {
    if (user && user.id) {
      const persistedTheme = localStorage.getItem(`presuapp_theme_${user.id}`) || 'dark';
      setTheme(persistedTheme);
      applyTheme(persistedTheme);
    }
  }, [user, applyTheme]);

  const changeTheme = useCallback((newTheme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    if (user && user.id) {
      localStorage.setItem(`presuapp_theme_${user.id}`, newTheme);
    } else {
      localStorage.setItem('presuapp_default_theme', newTheme);
    }
  }, [user, applyTheme]);

  const login = useCallback(async (email, password) => {
    const res = await axiosInstance.post('/auth/login', { email, password });
    const { data } = res.data;
    const receivedToken = data.token;
    const receivedUser = data.user;

    localStorage.setItem('token', receivedToken);
    localStorage.setItem('user', JSON.stringify(receivedUser));
    setToken(receivedToken);
    setUser(receivedUser);

    if (receivedUser && receivedUser.id) {
      const userTheme = localStorage.getItem(`presuapp_theme_${receivedUser.id}`) || 'dark';
      setTheme(userTheme);
      applyTheme(userTheme);
    }

    return receivedUser;
  }, [applyTheme]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    window.location.href = '/';
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axiosInstance.get('/auth/me');
      const freshUser = res.data.data;
      
      // Preserve role and status locally, as they are not returned in the /me endpoint
      let currentRole = 'USER';
      let currentStatus = 'ACTIVE';

      if (user && user.role) {
        currentRole = user.role;
      } else {
        const stored = localStorage.getItem('user');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed && parsed.role) currentRole = parsed.role;
            if (parsed && parsed.status) currentStatus = parsed.status;
          } catch {}
        }
      }

      if (user && user.status) {
        currentStatus = user.status;
      }

      const mergedUser = {
        ...freshUser,
        role: currentRole,
        status: currentStatus,
      };

      localStorage.setItem('user', JSON.stringify(mergedUser));
      setUser(mergedUser);
      return mergedUser;
    } catch (e) {
      console.error('Error refreshing profile:', e);
    }
  }, [token, user]);

  const value = {
    user,
    token,
    loading,
    theme,
    changeTheme,
    isAuthenticated: !!token,
    login,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
