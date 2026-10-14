import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Mail,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const { forgotPasswordVerifyToken, forgotPasswordReset } = useAuth();

  // Verification state: 'verifying' | 'valid' | 'invalid' | 'success'
  const [status, setStatus] = useState('verifying');
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Validate reset token on load
  useEffect(() => {
    let isMounted = true;

    if (!token) {
      setStatus('invalid');
      setErrorMessage('Missing password reset token in URL.');
      return;
    }

    const verify = async () => {
      try {
        const res = await forgotPasswordVerifyToken(token);
        if (isMounted) {
          if (res?.valid) {
            setEmail(res.email || '');
            setStatus('valid');
          } else {
            setStatus('invalid');
            setErrorMessage(res?.message || 'Invalid or expired password reset link.');
          }
        }
      } catch (err) {
        if (isMounted) {
          setStatus('invalid');
          setErrorMessage(err.response?.data?.message || 'This password reset link is invalid or has expired.');
        }
      }
    };

    verify();

    return () => {
      isMounted = false;
    };
  }, [token, forgotPasswordVerifyToken]);

  // Password Strength calculation
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: 'None', color: 'bg-gray-200' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-red-500' };
    if (score <= 4) return { score: 2, label: 'Medium', color: 'bg-amber-500' };
    return { score: 3, label: 'Strong', color: 'bg-green-500' };
  };

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (newPassword.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError('Passwords do not match. Please verify both fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await forgotPasswordReset({
        resetToken: token,
        email,
        newPassword,
        confirmPassword
      });
      toast.success(res.message || 'Password updated successfully!');
      setStatus('success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update password. Your reset session may have expired.';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-green-50/30">
      <div className="w-full max-w-md">
        
        {/* Card Container */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-600 to-green-600 p-8 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="inline-flex p-3 bg-white/15 backdrop-blur-md rounded-2xl mb-3 shadow-inner">
              <KeyRound size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">EcoDonate Account Recovery</h1>
            <p className="text-green-100 text-xs mt-1">Set a secure new password for your account</p>
          </div>

          <div className="p-8">
            
            {/* 1. STATE: VERIFYING TOKEN */}
            {status === 'verifying' && (
              <div className="py-12 text-center space-y-4">
                <LoadingSpinner size="large" color="green" />
                <p className="text-sm font-medium text-gray-600">
                  Verifying your secure password reset session...
                </p>
              </div>
            )}

            {/* 2. STATE: INVALID OR EXPIRED TOKEN */}
            {status === 'invalid' && (
              <div className="py-6 text-center space-y-5">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <AlertCircle size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Invalid or Expired Link</h3>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                    {errorMessage || 'For your protection, password reset links expire after 30 minutes or after being used once.'}
                  </p>
                </div>
                <div className="pt-2 flex flex-col gap-2.5">
                  <Link
                    to="/login"
                    className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2"
                  >
                    <span>Request New Reset Link</span>
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    to="/login"
                    className="text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    Back to Sign In
                  </Link>
                </div>
              </div>
            )}

            {/* 3. STATE: VALID TOKEN — ENTER NEW PASSWORD */}
            {status === 'valid' && (
              <form onSubmit={handleSubmit} className="space-y-5">
                
                {email && (
                  <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3 flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                      <Mail size={16} />
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Account Email</div>
                      <div className="text-xs font-bold text-gray-900">{email}</div>
                    </div>
                  </div>
                )}

                {formError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
                    <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoFocus
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {newPassword && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-gray-500">
                        <span>Strength:</span>
                        <span className="font-bold text-gray-700">{strength.label}</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex gap-1">
                        <div className={`h-full flex-1 rounded-full ${strength.score >= 1 ? strength.color : 'bg-transparent'}`} />
                        <div className={`h-full flex-1 rounded-full ${strength.score >= 2 ? strength.color : 'bg-transparent'}`} />
                        <div className={`h-full flex-1 rounded-full ${strength.score >= 3 ? strength.color : 'bg-transparent'}`} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Re-enter your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !newPassword || !confirmPassword}
                  className="w-full py-3.5 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="small" color="white" />
                      <span>Saving New Password...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* 4. STATE: SUCCESS */}
            {status === 'success' && (
              <div className="py-6 text-center space-y-5">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
                  <CheckCircle2 size={36} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">Password Updated!</h3>
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                    Your password has been reset securely. You can now log into your account with your new credentials.
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    to="/login"
                    className="w-full py-3.5 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 hover:shadow-lg"
                  >
                    <span>Proceed to Sign In</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-xs font-semibold text-gray-600 hover:text-green-700 transition-colors"
          >
            ← Back to Login
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ResetPasswordPage;
