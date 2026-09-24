import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { getMe, login as apiLogin, register as apiRegister, logout as apiLogout } from '../services/auth';
import { toast } from 'react-hot-toast';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const authInProgressRef = useRef(false);

  // Verify token on initial mount only
  useEffect(() => {
    let cancelled = false;
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        if (!cancelled) {
          setLoading(false);
          setIsAuthenticated(false);
          setUser(null);
        }
        return;
      }
      // If login/register just completed, skip getMe since state is already set
      if (authInProgressRef.current) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const userData = await getMe();
        if (!cancelled) {
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Session validation failed:', error?.response?.status, error?.message);
        if (!cancelled) {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    verifyToken();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      authInProgressRef.current = true;
      const data = await apiLogin(email, password);
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      setLoading(false);
      toast.success('Login successful!');
      return data;
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed';
      toast.error(msg);
      throw error;
    } finally {
      authInProgressRef.current = false;
    }
  }, []);

  const register = useCallback(async (formData) => {
    try {
      authInProgressRef.current = true;
      const data = await apiRegister(formData);
      // Auto-login for all registered users
      if (data.token && data.user) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        setIsAuthenticated(true);
        setLoading(false);
      }
      return data;
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed';
      toast.error(msg);
      throw error;
    } finally {
      authInProgressRef.current = false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      toast.success('Logged out successfully');
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await getMe();
      setUser(userData);
      return userData;
    } catch (e) {
      console.warn('Failed to refresh user:', e?.message);
    }
  }, []);

  const updateUser = useCallback((updatedFields) => {
    setUser(prev => (prev ? { ...prev, ...updatedFields } : prev));
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated, login, register, logout, refreshUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
