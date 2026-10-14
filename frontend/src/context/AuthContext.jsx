import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  getMe,
  login as apiLogin,
  googleLogin as apiGoogleLogin,
  registerRequest as apiRegisterRequest,
  verifyRegistrationOtp as apiVerifyRegistrationOtp,
  resendRegistrationOtp as apiResendRegistrationOtp,
  forgotPasswordSendOtp as apiForgotPasswordSendOtp,
  forgotPasswordVerifyOtp as apiForgotPasswordVerifyOtp,
  forgotPasswordReset as apiForgotPasswordReset,
  logout as apiLogout,
  syncSession
} from '../services/auth';
import { auth, googleProvider } from '../services/firebase';
import { signInWithPopup, signInWithEmailAndPassword, signOut } from 'firebase/auth';
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
      const cachedUserData = (() => {
        try {
          const s = localStorage.getItem('ecodonate_user');
          return s ? JSON.parse(s) : null;
        } catch (e) { return null; }
      })();

      if (!storedToken && !cachedUserData) {
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
        const status = error?.response?.status;

        // If backend cold-started or ephemeral DB wiped, heal session transparently
        if ((status === 404 || status === 401) && cachedUserData) {
          try {
            console.log('[AuthContext] Attempting self-healing session restoration...');
            const syncRes = await syncSession(cachedUserData);
            if (syncRes && syncRes.token && syncRes.user && !cancelled) {
              saveAuthSession(syncRes.token, syncRes.user);
              console.log('[AuthContext] Session restored successfully.');
              return;
            }
          } catch (syncErr) {
            console.warn('[AuthContext] Session auto-heal note:', syncErr.message);
          }
        }

        // Only clear session if explicitly revoked/blocked (403), or 401 with no cached data
        if (status === 403 || (status === 401 && !cachedUserData)) {
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

      // Also sign in to client Firebase Auth if initialized
      try {
        if (auth && password) {
          await signInWithEmailAndPassword(auth, email, password);
        }
      } catch (fbClientErr) {}

      toast.success(data.message || 'Login successful!');
      return data;
    } catch (error) {
      // Re-throw so page components can display specific error messages or status banners
      throw error;
    } finally {
      authInProgressRef.current = false;
    }
  }, []);

  // 1b. Google Firebase Authentication Login
  const loginWithGoogle = useCallback(async () => {
    try {
      if (!auth || !googleProvider) {
        toast.error('Google Sign-In is unavailable or still initializing. Please try again.');
        return null;
      }
      authInProgressRef.current = true;
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      const payload = {
        email: firebaseUser.email,
        name: firebaseUser.displayName || 'Google User',
        photoURL: firebaseUser.photoURL || null,
        uid: firebaseUser.uid
      };

      const data = await apiGoogleLogin(payload);
      saveAuthSession(data.token, data.user);
      toast.success(data.message || `Welcome, ${data.user.name}!`);
      return data;
    } catch (error) {
      if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
        return null;
      }
      throw error;
    } finally {
      authInProgressRef.current = false;
    }
  }, []);

  // 2. Direct Registration (Auto-authenticates active users; pending NGO/dealer accounts wait for admin approval)
  const registerRequest = useCallback(async (formData) => {
    try {
      const res = await apiRegisterRequest(formData);
      if (res && res.token && res.user && res.status !== 'pending') {
        saveAuthSession(res.token, res.user);

        // Also sign in to client-side Firebase Auth if password available
        try {
          if (auth && formData.password) {
            await signInWithEmailAndPassword(auth, formData.email, formData.password);
          }
        } catch (fbClientErr) {}
      }
      return res;
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
      try {
        if (auth) {
          await signOut(auth);
        }
      } catch (fbOutErr) {}
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
        loginWithGoogle,
        saveAuthSession,
        register: registerRequest,
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
