import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Leaf,
  Smartphone,
  KeyRound,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';

const LoginPage = () => {
  // Tabs: 'otp' | 'password'
  const [authMethod, setAuthMethod] = useState('otp');

  // OTP Mode State
  const [identifier, setIdentifier] = useState('');
  const [otpStep, setOtpStep] = useState('request'); // 'request' | 'verify'
  const [enteredOtp, setEnteredOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [isNewUserStep, setIsNewUserStep] = useState(false);

  // Password Mode State
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Shared state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { login, sendOtp, verifyOtp, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      redirectToDashboard(user.role);
    }
  }, [isAuthenticated, user]);

  // Resend OTP countdown
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const redirectToDashboard = (role) => {
    const from = location.state?.from?.pathname;
    if (from) {
      navigate(from, { replace: true });
    } else {
      if (role === 'admin') navigate('/admin/dashboard', { replace: true });
      else if (role === 'ngo') navigate('/ngo/dashboard', { replace: true });
      else if (role === 'scrapdealer') navigate('/dealer/dashboard', { replace: true });
      else navigate('/dashboard', { replace: true });
    }
  };

  // --------------------------------------------------------------------------
  // OTP Method Handlers
  // --------------------------------------------------------------------------
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setError('');

    const cleanId = identifier.trim();
    if (!cleanId) {
      setError('Please enter your mobile phone number or email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await sendOtp(cleanId);
      if (res.otp) {
        setGeneratedOtp(res.otp);
      }
      setOtpStep('verify');
      setResendTimer(30);
      toast.success(res.message || 'Verification code sent!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    setError('');

    const cleanOtp = enteredOtp.trim();
    if (!cleanOtp) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        identifier: identifier.trim(),
        otp: cleanOtp
      };

      if (isNewUserStep) {
        if (!newName.trim()) {
          setError('Please provide your name to complete sign up.');
          setIsSubmitting(false);
          return;
        }
        payload.name = newName.trim();
        payload.role = newRole;
      }

      const res = await verifyOtp(payload);

      if (res.isNewUser && !isNewUserStep) {
        setIsNewUserStep(true);
        toast.info('Code verified! Please provide your name to finish your account setup.');
      } else if (res.user) {
        redirectToDashboard(res.user.role);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --------------------------------------------------------------------------
  // Password Method Handler
  // --------------------------------------------------------------------------
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!loginId.trim() || !password) {
      setError('Please enter both your identifier (email/phone/username) and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await login(loginId.trim(), password);
      redirectToDashboard(data.user.role);
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[88vh] flex items-center justify-center bg-gradient-to-b from-gray-50 to-green-50/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-7 sm:p-8 rounded-3xl shadow-xl border border-gray-100 transition-all">
        
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex p-3 bg-green-100/70 rounded-2xl border border-green-200 shadow-xs mb-3">
            <Leaf className="h-9 w-9 text-green-600 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Sign in to EcoDonate</h2>
          <p className="mt-1 text-xs text-gray-500 font-medium">
            Next-generation green recycling & donation platform
          </p>
        </div>

        {/* Auth Method Navigation Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-gray-100/90 rounded-2xl border border-gray-200/80">
          <button
            type="button"
            onClick={() => { setAuthMethod('otp'); setError(''); }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              authMethod === 'otp'
                ? 'bg-white text-green-700 shadow-sm border border-gray-200/50'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Smartphone size={16} className={authMethod === 'otp' ? 'text-green-600' : 'text-gray-400'} />
            <span>One-Time Code (OTP)</span>
          </button>

          <button
            type="button"
            onClick={() => { setAuthMethod('password'); setError(''); }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              authMethod === 'password'
                ? 'bg-white text-green-700 shadow-sm border border-gray-200/50'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <KeyRound size={16} className={authMethod === 'password' ? 'text-green-600' : 'text-gray-400'} />
            <span>Password Sign In</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle size={17} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="font-semibold leading-relaxed">{error}</p>
          </div>
        )}

        {/* ================================================================= */}
        {/* METHOD 1: ONE-TIME PASSCODE (OTP) */}
        {/* ================================================================= */}
        {authMethod === 'otp' && (
          <div className="space-y-4">
            {otpStep === 'request' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-gray-700">Mobile Number or Email</label>
                    <span className="text-[10px] text-green-700 font-semibold bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                      Passwordless Login
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9876543211 or rahul@example.com"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-xl text-sm shadow-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                  />
                  <p className="mt-1.5 text-[11px] text-gray-400">
                    We'll generate an instant 6-digit verification code. No password needed!
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <LoadingSpinner size="small" className="text-white" />
                  ) : (
                    <>
                      <span>Get Verification Code</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs">
                  <div>
                    <span className="text-gray-500">Code sent to: </span>
                    <span className="font-bold text-gray-900">{identifier}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setOtpStep('request'); setEnteredOtp(''); setError(''); }}
                    className="text-green-600 hover:text-green-700 font-bold underline"
                  >
                    Change
                  </button>
                </div>

                {/* Instant Verification Helper Badge */}
                {generatedOtp && (
                  <div
                    onClick={() => setEnteredOtp(generatedOtp)}
                    className="cursor-pointer p-3 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs text-emerald-900 shadow-xs hover:bg-emerald-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-emerald-600" />
                      <span>Security Code: <strong className="text-emerald-800 tracking-wider text-sm">{generatedOtp}</strong></span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-lg border border-emerald-200">
                      Tap to auto-fill
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Enter 6-Digit Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="• • • • • •"
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-xl text-center text-xl font-bold tracking-widest text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                    autoFocus
                  />
                </div>

                {/* New user quick setup (if identifier is unregistered) */}
                {isNewUserStep && (
                  <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-3 animate-fadeIn">
                    <p className="text-xs font-bold text-blue-900">New Account Setup (10 Seconds):</p>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">Your Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ramesh Kumar"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">Account Role</label>
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white"
                      >
                        <option value="user">Individual Donor / Citizen</option>
                        <option value="ngo">NGO Partner Organization</option>
                        <option value="scrapdealer">Scrap Dealer / Recycler</option>
                      </select>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || enteredOtp.length < 6}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <LoadingSpinner size="small" className="text-white" />
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>{isNewUserStep ? 'Complete Sign Up & Enter' : 'Verify & Sign In'}</span>
                    </>
                  )}
                </button>

                <div className="text-center pt-1">
                  {resendTimer > 0 ? (
                    <span className="text-xs text-gray-400">Resend code in {resendTimer}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="text-xs font-bold text-green-600 hover:text-green-700 inline-flex items-center gap-1"
                    >
                      <RefreshCw size={12} /> Resend verification code
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* METHOD 2: TRADITIONAL PASSWORD SIGN IN */}
        {/* ================================================================= */}
        {authMethod === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4 animate-fadeIn">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Email, Username, or Mobile Phone
              </label>
              <input
                type="text"
                required
                placeholder="e.g. rahul@example.com or 9876543211"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-70"
            >
              {isSubmitting ? <LoadingSpinner size="small" className="text-white" /> : 'Sign in with Password'}
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className="border-t border-gray-100 pt-4 text-center">
          <p className="text-xs text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-green-600 hover:text-green-700 hover:underline">
              Create an Account
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
