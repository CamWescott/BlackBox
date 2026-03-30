import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('blackbox_token');
    const savedUser = localStorage.getItem('blackbox_user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('blackbox_token', data.token);
    localStorage.setItem('blackbox_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const register = async (email, name, password) => {
    const data = await api.post('/api/auth/register', { email, name, password });
    localStorage.setItem('blackbox_token', data.token);
    localStorage.setItem('blackbox_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('blackbox_token');
    localStorage.removeItem('blackbox_user');
    setUser(null);
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    localStorage.setItem('blackbox_user', JSON.stringify(updated));
    setUser(updated);
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
