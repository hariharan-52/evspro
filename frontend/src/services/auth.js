import api from './api';

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
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
  // Assuming a stateless JWT setup, logout just clears local token, 
  // but we can call API if required.
  try {
    await api.post('/auth/logout');
  } catch (err) {
    console.log(err);
  }
};
