import api from './api';

// 1. Production Login (Real credentials)
export const login = async (email, password, rememberMe = false) => {
  const response = await api.post('/auth/login', { email, password, rememberMe });
  return response.data;
};

// 2. Production Registration & Email OTP Flow
export const registerRequest = async (registrationData) => {
  const response = await api.post('/auth/register-request', registrationData);
  return response.data;
};

export const verifyRegistrationOtp = async (email, otp) => {
  const response = await api.post('/auth/verify-registration-otp', { email, otp });
  return response.data;
};

export const resendRegistrationOtp = async (email) => {
  const response = await api.post('/auth/resend-registration-otp', { email });
  return response.data;
};

// Legacy alias
export const register = async (data) => {
  return registerRequest(data);
};

// 3. Production Forgot Password Flow
export const forgotPasswordSendOtp = async (email) => {
  const response = await api.post('/auth/forgot-password/send-otp', { email });
  return response.data;
};

export const forgotPasswordVerifyOtp = async (email, otp) => {
  const response = await api.post('/auth/forgot-password/verify-otp', { email, otp });
  return response.data;
};

export const forgotPasswordReset = async ({ email, resetToken, newPassword, confirmPassword }) => {
  const response = await api.post('/auth/forgot-password/reset', {
    email,
    resetToken,
    newPassword,
    confirmPassword
  });
  return response.data;
};

// 4. Session & Identity
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
