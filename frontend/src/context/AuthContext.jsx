import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  getMe,
  login as apiLogin,
  sendOtp as apiSendOtp,
  verifyOtp as apiVerifyOtp,
  quickLogin as apiQuickLogin,
  register as apiRegister,
  logout as apiLogout
} from '../services/auth';
import { toast } from 'react-hot-toast';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Read token and cached user from localStorage for instant, zero-flicker load
  const initialToken = localStorage.getItem('token');
  const initialUser = (() => {
    try {
      const stored = localStorage.getItem('ecodonate_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  })();

  const [user, setUser] = useState(initialUser);
  const [token, setToken] = useState(initialToken);
  const [loading, setLoading] = useState(!initialUser && !!initialToken);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(initialToken && initialUser));
  const authInProgressRef = useRef(false);

  // Background token verification & sync
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

      if (authInProgressRef.current) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const userData = await getMe();
        if (!cancelled) {
          setUser(userData);
          localStorage.setItem('ecodonate_user', JSON.stringify(userData));
          setIsAuthenticated(true);
        }
      } catch (error) {
        // If 401 or 403, clear session; if network error, preserve cached offline session
        const status = error?.response?.status;
        if (status === 401 || status === 403) {
          if (!cancelled) {
            localStorage.removeItem('token');
            localStorage.removeItem('ecodonate_user');
            setToken(null);
            setUser(null);
            setIsAuthenticated(false);
          }
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

  const saveAuthSession = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('ecodonate_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setIsAuthenticated(true);
    setLoading(false);
  };

  // 1. Passwordless OTP: Send Code
  const sendOtp = useCallback(async (identifier) => {
    try {
      return await apiSendOtp(identifier);
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to send verification code';
      toast.error(msg);
      throw error;
    }
  }, []);

  // 2. Passwordless OTP: Verify Code
  const verifyOtp = useCallback(async (payload) => {
    try {
      authInProgressRef.current = true;
      const data = await apiVerifyOtp(payload);

      if (data.token && data.user) {
        saveAuthSession(data.token, data.user);
        toast.success(data.message || 'Signed in successfully!');
      }
      return data;
    } catch (error) {
      const msg = error.response?.data?.message || 'Verification failed';
      toast.error(msg);
      throw error;
    } finally {
      authInProgressRef.current = false;
    }
  }, []);

  // 3. Quick One-Click Demo Login
  const quickLogin = useCallback(async (role, email) => {
    try {
      authInProgressRef.current = true;
      const data = await apiQuickLogin(role, email);
      if (data.token && data.user) {
        saveAuthSession(data.token, data.user);
        toast.success(data.message || `Signed in as ${data.user.name}`);
      }
      return data;
    } catch (error) {
      const msg = error.response?.data?.message || 'Quick login failed';
      toast.error(msg);
      throw error;
    } finally {
      authInProgressRef.current = false;
    }
  }, []);

  // 4. Standard Password Login
  const login = useCallback(async (identifier, password) => {
    try {
      authInProgressRef.current = true;
      const data = await apiLogin(identifier, password);
      saveAuthSession(data.token, data.user);
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

  // 5. Registration
  const register = useCallback(async (formData) => {
    try {
      authInProgressRef.current = true;
      const data = await apiRegister(formData);
      if (data.token && data.user) {
        saveAuthSession(data.token, data.user);
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

  // 6. Logout
  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('ecodonate_user');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      toast.success('Logged out successfully');
    }
  }, []);

  // 7. Refresh User
  const refreshUser = useCallback(async () => {
    try {
      const userData = await getMe();
      setUser(userData);
      localStorage.setItem('ecodonate_user', JSON.stringify(userData));
      return userData;
    } catch (e) {
      console.warn('Failed to refresh user:', e?.message);
    }
  }, []);

  // 8. Update User state locally
  const updateUser = useCallback((updatedFields) => {
    setUser(prev => {
      const nextUser = prev ? { ...prev, ...updatedFields } : prev;
      if (nextUser) {
        localStorage.setItem('ecodonate_user', JSON.stringify(nextUser));
      }
      return nextUser;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        sendOtp,
        verifyOtp,
        quickLogin,
        login,
        register,
        logout,
        refreshUser,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
