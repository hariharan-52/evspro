import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Leaf,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  ShieldCheck,
  KeyRound
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';

const LoginPage = () => {
  // Login Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [accountStatusNotice, setAccountStatusNotice] = useState(null); // { type: 'pending'|'rejected'|'unverified', message: string }

  // Forgot Password Wizard State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState('email'); // 'email' | 'otp' | 'new_password' | 'success'
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotResetToken, setForgotResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotCooldown, setForgotCooldown] = useState(0);
  const [forgotExpiresIn, setForgotExpiresIn] = useState(600);

  const {
    login,
    forgotPasswordSendOtp,
    forgotPasswordVerifyOtp,
    forgotPasswordReset,
    isAuthenticated,
    user
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      redirectToDashboard(user.role);
    }
  }, [isAuthenticated, user]);

  // Forgot password cooldown timer
  useEffect(() => {
    let interval = null;
    if (forgotCooldown > 0) {
      interval = setInterval(() => setForgotCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [forgotCooldown]);

  // Forgot password OTP expiration timer
  useEffect(() => {
    let interval = null;
    if (showForgotModal && forgotStep === 'otp' && forgotExpiresIn > 0) {
      interval = setInterval(() => setForgotExpiresIn((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [showForgotModal, forgotStep, forgotExpiresIn]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const redirectToDashboard = (role) => {
    const from = location.state?.from?.pathname;
    if (from && !from.includes('/login') && !from.includes('/register')) {
      navigate(from, { replace: true });
    } else {
      if (role === 'admin') navigate('/admin/dashboard', { replace: true });
      else if (role === 'ngo') navigate('/ngo/dashboard', { replace: true });
      else if (role === 'scrapdealer') navigate('/dealer/dashboard', { replace: true });
      else navigate('/dashboard', { replace: true });
    }
  };

  // ============================================================================
  // Handle Login Submission
  // ============================================================================
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setAccountStatusNotice(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setLoginError('Please enter both your email address and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await login(cleanEmail, password, rememberMe);
      redirectToDashboard(data.user.role);
    } catch (err) {
      const status = err.response?.status;
      const respData = err.response?.data;
      const msg = respData?.message || 'Login failed. Please check your credentials.';

      if (status === 403) {
        if (respData?.code === 'ACCOUNT_PENDING' || msg.includes('awaiting Admin approval')) {
          setAccountStatusNotice({
            type: 'pending',
            title: 'Your Account is Awaiting Admin Approval',
            message: 'Your email has been verified, but our administrator must review and approve your account before you can log in. Please check back later.'
          });
        } else if (respData?.code === 'ACCOUNT_REJECTED' || msg.includes('rejected')) {
          setAccountStatusNotice({
            type: 'rejected',
            title: 'Account Registration Rejected',
            message: 'Your registration was reviewed and rejected by the platform administrator. Access to protected features is restricted.'
          });
        } else if (respData?.code === 'EMAIL_NOT_VERIFIED' || msg.includes('verify your email')) {
          setAccountStatusNotice({
            type: 'unverified',
            title: 'Email Address Not Verified',
            message: 'Please verify your email address to complete your registration.'
          });
        } else {
          setLoginError(msg);
        }
      } else {
        setLoginError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // Forgot Password Step 1: Send OTP
  // ============================================================================
  const handleForgotSendOtp = async (e) => {
    e.preventDefault();
    setForgotError('');

    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setForgotError('Please enter your registered email address.');
      return;
    }

    setForgotSubmitting(true);
    try {
      const res = await forgotPasswordSendOtp(cleanEmail);
      toast.success(res.message || 'Password reset code sent to your email!');
      setForgotStep('otp');
      setForgotCooldown(30);
      setForgotExpiresIn(600);
      setForgotOtp('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send reset code. Please check your email.';
      setForgotError(msg);
    } finally {
      setForgotSubmitting(false);
    }
  };

  // ============================================================================
  // Forgot Password Step 2: Verify OTP
  // ============================================================================
  const handleForgotVerifyOtp = async (e) => {
    e.preventDefault();
    setForgotError('');

    const cleanOtp = forgotOtp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setForgotError('Please enter the 6-digit code sent to your email.');
      return;
    }

    setForgotSubmitting(true);
    try {
      const res = await forgotPasswordVerifyOtp(forgotEmail.trim().toLowerCase(), cleanOtp);
      setForgotResetToken(res.resetToken);
      toast.success('Code verified successfully!');
      setForgotStep('new_password');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired verification code.';
      setForgotError(msg);
    } finally {
      setForgotSubmitting(false);
    }
  };

  // Resend OTP in Forgot Password
  const handleForgotResendOtp = async () => {
    if (forgotCooldown > 0 || forgotSubmitting) return;
    setForgotError('');
    setForgotSubmitting(true);
    try {
      const res = await forgotPasswordSendOtp(forgotEmail.trim().toLowerCase());
      toast.success(res.message || 'New reset code sent!');
      setForgotCooldown(30);
      setForgotExpiresIn(600);
      setForgotOtp('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend code.';
      setForgotError(msg);
    } finally {
      setForgotSubmitting(false);
    }
  };

  // ============================================================================
  // Forgot Password Step 3: Reset Password
  // ============================================================================
  const handleForgotResetPassword = async (e) => {
    e.preventDefault();
    setForgotError('');

    if (!newPassword || newPassword.length < 6) {
      setForgotError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setForgotError('Passwords do not match. Please verify both fields.');
      return;
    }

    setForgotSubmitting(true);
    try {
      const res = await forgotPasswordReset({
        email: forgotEmail.trim().toLowerCase(),
        resetToken: forgotResetToken,
        newPassword,
        confirmPassword: confirmNewPassword
      });
      toast.success(res.message || 'Password reset successfully!');
      setForgotStep('success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reset password. Please start over.';
      setForgotError(msg);
    } finally {
      setForgotSubmitting(false);
    }
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotStep('email');
    setForgotOtp('');
    setForgotResetToken('');
    setNewPassword('');
    setConfirmNewPassword('');
    setForgotError('');
  };

  const handleFinishPasswordReset = () => {
    setEmail(forgotEmail);
    setPassword('');
    closeForgotModal();
    toast.success('You can now log in with your new password.');
  };

  return (
    <div className="min-h-[88vh] flex items-center justify-center bg-gradient-to-b from-gray-50 to-green-50/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-7 sm:p-9 rounded-3xl shadow-xl border border-gray-100 transition-all">
        
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex p-3 bg-green-100/70 rounded-2xl border border-green-200 shadow-xs mb-3">
            <Leaf className="h-8 w-8 text-green-600 animate-pulse" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Sign in to EcoDonate</h1>
          <p className="mt-1 text-xs text-gray-500 font-medium">
            Sustainable recycling, donation distribution & green community impact
          </p>
        </div>

        {/* Account Approval / State Notice Banner */}
        {accountStatusNotice && (
          <div
            className={`p-4 rounded-2xl border text-xs animate-fadeIn ${
              accountStatusNotice.type === 'pending'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : accountStatusNotice.type === 'rejected'
                ? 'bg-red-50 border-red-200 text-red-900'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {accountStatusNotice.type === 'pending' ? (
                <Clock size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              ) : accountStatusNotice.type === 'rejected' ? (
                <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
              ) : (
                <Mail size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wide mb-1">
                  {accountStatusNotice.title}
                </h4>
                <p className="leading-relaxed opacity-90">{accountStatusNotice.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* General Error Banner */}
        {loginError && !accountStatusNotice && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle size={17} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="font-semibold leading-relaxed">{loginError}</p>
          </div>
        )}

        {/* Standard Production Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email Address */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="e.g. rahul@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setLoginError('');
                  setAccountStatusNotice(null);
                }}
                className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm shadow-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-700">
                Password <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setShowForgotModal(true);
                  setForgotStep('email');
                }}
                className="text-xs font-bold text-green-600 hover:text-green-700 transition-all hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="Enter your account password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setLoginError('');
                  setAccountStatusNotice(null);
                }}
                className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl text-sm shadow-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center text-xs text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer"
              />
              <span className="ml-2">Remember me on this browser</span>
            </label>
          </div>

          {/* Sign In Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-2xl shadow-sm text-sm font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="small" color="white" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer: Register / Create Account Link */}
        <div className="pt-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-500">
            Don't have an EcoDonate account yet?{' '}
            <Link
              to="/register"
              className="font-bold text-green-600 hover:text-green-700 underline underline-offset-2"
            >
              Create Account
            </Link>
          </p>
        </div>

      </div>

      {/* ======================================================================= */}
      {/* FORGOT PASSWORD MODAL WIZARD */}
      {/* ======================================================================= */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 overflow-hidden relative">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-green-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100/70 text-blue-600 rounded-xl">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Reset Your Password</h3>
                  <p className="text-xs text-gray-500">Secure email OTP verification</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeForgotModal}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Error */}
            {forgotError && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                <span>{forgotError}</span>
              </div>
            )}

            <div className="p-6">
              {/* STEP 1: ENTER REGISTERED EMAIL */}
              {forgotStep === 'email' && (
                <form onSubmit={handleForgotSendOtp} className="space-y-4">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Enter the email address registered with your EcoDonate account. We will send a secure 6-digit verification code to reset your password.
                  </p>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Registered Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                      <input
                        type="email"
                        required
                        autoFocus
                        placeholder="e.g. rahul@example.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotSubmitting}
                    className="w-full py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {forgotSubmitting ? (
                      <>
                        <LoadingSpinner size="small" color="white" />
                        <span>Sending Reset Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Verification Code</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* STEP 2: ENTER OTP */}
              {forgotStep === 'otp' && (
                <form onSubmit={handleForgotVerifyOtp} className="space-y-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">
                      Enter the 6-digit verification code sent to:
                    </p>
                    <p className="text-xs font-bold text-gray-900 mt-0.5">{forgotEmail}</p>
                  </div>

                  <div className="flex justify-center">
                    <input
                      type="text"
                      required
                      maxLength={6}
                      autoFocus
                      placeholder="••••••"
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-48 text-center text-xl font-bold tracking-[6px] py-2.5 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Clock size={13} className="text-amber-500" />
                      Expires in: <strong className="font-mono text-gray-800">{formatTimer(forgotExpiresIn)}</strong>
                    </span>

                    <button
                      type="button"
                      disabled={forgotCooldown > 0 || forgotSubmitting}
                      onClick={handleForgotResendOtp}
                      className="font-bold text-green-600 hover:text-green-700 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <RefreshCw size={12} className={forgotSubmitting ? 'animate-spin' : ''} />
                      <span>{forgotCooldown > 0 ? `Resend in ${forgotCooldown}s` : 'Resend Code'}</span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotSubmitting || forgotOtp.length !== 6}
                    className="w-full py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {forgotSubmitting ? (
                      <>
                        <LoadingSpinner size="small" color="white" />
                        <span>Verifying Code...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={16} />
                        <span>Verify Code</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* STEP 3: NEW PASSWORD */}
              {forgotStep === 'new_password' && (
                <form onSubmit={handleForgotResetPassword} className="space-y-4">
                  <p className="text-xs text-gray-600">
                    Identity verified! Please create a strong new password for your account.
                  </p>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        placeholder="Minimum 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                      <input
                        type={showConfirmNewPassword ? 'text' : 'password'}
                        required
                        placeholder="Re-enter new password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotSubmitting}
                    className="w-full py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {forgotSubmitting ? (
                      <>
                        <LoadingSpinner size="small" color="white" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <span>Reset Password</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* STEP 4: SUCCESS */}
              {forgotStep === 'success' && (
                <div className="space-y-4 text-center py-2">
                  <div className="inline-flex p-3 bg-green-100 text-green-600 rounded-full">
                    <CheckCircle2 size={36} />
                  </div>

                  <div>
                    <h4 className="font-bold text-base text-gray-900">Password Reset Successfully!</h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Your password has been securely updated. You can now log in using your new credentials.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleFinishPasswordReset}
                    className="w-full py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2"
                  >
                    <span>Continue to Login</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LoginPage;
