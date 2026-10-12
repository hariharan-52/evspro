import axios from 'axios';
import { API_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach token from localStorage to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle impact update broadcasting & 401 gracefully
api.interceptors.response.use(
  (response) => {
    // If a modifying action on donations or recycling succeeds, broadcast impact update event
    const method = (response.config?.method || '').toLowerCase();
    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      const url = response.config?.url || '';
      if (url.includes('donation') || url.includes('recycling') || url.includes('ngo') || url.includes('scrap')) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('eco_impact_updated', { detail: { url, method } }));
          try {
            localStorage.setItem('eco_last_impact_update', Date.now().toString());
          } catch (e) {}
        }
      }
    }
    return response;
  },
  (error) => {
    const url = error.config?.url || '';
    
    // Never redirect to login for auth routes (login, register, me, logout)
    const isAuthRoute = url.includes('auth');
    
    // Never redirect for notification-related routes (they fire in background)
    const isBackgroundRoute = url.includes('notifications');
    
    if (
      error.response &&
      error.response.status === 401 &&
      !isAuthRoute &&
      !isBackgroundRoute
    ) {
      // Only redirect if user was previously authenticated (had a token)
      const hadToken = !!localStorage.getItem('token');
      localStorage.removeItem('token');
      if (hadToken && typeof window !== 'undefined' && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
