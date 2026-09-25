import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  getMe,
  login as apiLogin,
  registerRequest as apiRegisterRequest,
  verifyRegistrationOtp as apiVerifyRegistrationOtp,
  resendRegistrationOtp as apiResendRegistrationOtp,
  forgotPasswordSendOtp as apiForgotPasswordSendOtp,
  forgotPasswordVerifyOtp as apiForgotPasswordVerifyOtp,
  forgotPasswordReset as apiForgotPasswordReset,
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

  // 1. Production Login (Real database credentials)
  const login = useCallback(async (email, password, rememberMe = false) => {
    try {
      authInProgressRef.current = true;
      const data = await apiLogin(email, password, rememberMe);
      saveAuthSession(data.token, data.user);
      toast.success(data.message || 'Login successful!');
      return data;
    } catch (error) {
      // Re-throw so page components can display specific error messages or status banners
      throw error;
    } finally {
      authInProgressRef.current = false;
    }
  }, []);

  // 2. Registration Request (Step 1)
  const registerRequest = useCallback(async (formData) => {
    try {
      return await apiRegisterRequest(formData);
    } catch (error) {
      throw error;
    }
  }, []);

  // 3. Verify Registration Email OTP (Step 2)
  const verifyRegistrationOtp = useCallback(async (email, otp) => {
    try {
      return await apiVerifyRegistrationOtp(email, otp);
    } catch (error) {
      throw error;
    }
  }, []);

  // 4. Resend Registration Email OTP
  const resendRegistrationOtp = useCallback(async (email) => {
    try {
      return await apiResendRegistrationOtp(email);
    } catch (error) {
      throw error;
    }
  }, []);

  // 5. Forgot Password: Send OTP
  const forgotPasswordSendOtp = useCallback(async (email) => {
    try {
      return await apiForgotPasswordSendOtp(email);
    } catch (error) {
      throw error;
    }
  }, []);

  // 6. Forgot Password: Verify OTP
  const forgotPasswordVerifyOtp = useCallback(async (email, otp) => {
    try {
      return await apiForgotPasswordVerifyOtp(email, otp);
    } catch (error) {
      throw error;
    }
  }, []);

  // 7. Forgot Password: Reset Password
  const forgotPasswordReset = useCallback(async (payload) => {
    try {
      return await apiForgotPasswordReset(payload);
    } catch (error) {
      throw error;
    }
  }, []);

  // 8. Logout
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

  // 9. Refresh User
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

  // 10. Update User locally
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
        login,
        registerRequest,
        verifyRegistrationOtp,
        resendRegistrationOtp,
        forgotPasswordSendOtp,
        forgotPasswordVerifyOtp,
        forgotPasswordReset,
        logout,
        refreshUser,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
