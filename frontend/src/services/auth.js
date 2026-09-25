import api from './api';

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const sendOtp = async (identifier) => {
  const response = await api.post('/auth/send-otp', { identifier });
  return response.data;
};

export const verifyOtp = async (payload) => {
  const response = await api.post('/auth/verify-otp', payload);
  return response.data;
};


export const register = async (data) => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } catch (err) {
    console.warn('Logout API error:', err.message);
  }
};
