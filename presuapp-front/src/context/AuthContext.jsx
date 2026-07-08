import { createContext, useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axios';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await axiosInstance.post('/auth/login', { email, password });
    const { data } = res.data;
    const receivedToken = data.token;
    const receivedUser = data.user;

    localStorage.setItem('token', receivedToken);
    localStorage.setItem('user', JSON.stringify(receivedUser));
    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  }, []);

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
      localStorage.setItem('user', JSON.stringify(freshUser));
      setUser(freshUser);
      return freshUser;
    } catch (e) {
      console.error('Error refreshing profile:', e);
    }
  }, [token]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
