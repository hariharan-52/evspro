import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Leaf, Clock, AlertCircle } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If already authenticated, redirect to appropriate dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      const role = user.role;
      if (role === 'admin') navigate('/admin/dashboard', { replace: true });
      else if (role === 'ngo') navigate('/ngo/dashboard', { replace: true });
      else if (role === 'scrapdealer') navigate('/dealer/dashboard', { replace: true });
      else navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsPendingApproval(false);
    
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const data = await login(email.trim(), password);
      const role = data.user.role;
      
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else {
        if (role === 'admin') navigate('/admin/dashboard', { replace: true });
        else if (role === 'ngo') navigate('/ngo/dashboard', { replace: true });
        else if (role === 'scrapdealer') navigate('/dealer/dashboard', { replace: true });
        else navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(msg);
      if (status === 403 && (msg.toLowerCase().includes('pending') || msg.toLowerCase().includes('admin approval') || msg.toLowerCase().includes('verified and approved'))) {
        setIsPendingApproval(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        {/* Title */}
        <div className="text-center">
          <div className="inline-flex p-3 bg-green-50 rounded-2xl border border-green-200 mb-3">
            <Leaf className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome Back to EcoDonate</h2>
          <p className="mt-1 text-xs text-gray-500">
            Sign in to your account with your email and password.
          </p>
        </div>

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className={`p-4 rounded-xl text-xs border flex items-start gap-3 ${
              isPendingApproval
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : 'bg-red-50 border-red-300 text-red-800'
            }`}>
              {isPendingApproval ? (
                <Clock className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
              ) : (
                <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
              )}
              <div>
                <p className="font-bold">{isPendingApproval ? 'Approval Required Before Login' : 'Authentication Error'}</p>
                <p className="mt-0.5 leading-relaxed">{error}</p>
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-xs font-semibold text-gray-700">Email Address, User ID, or Phone</label>
            <input
              type="text"
              required
              placeholder="e.g. user@example.com, username, or phone"
              className="mt-1 block w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm shadow-xs focus:ring-green-500 focus:border-green-500 bg-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700">Password</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter your password"
                className="block w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm shadow-xs focus:ring-green-500 focus:border-green-500 bg-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70 transition-colors"
          >
            {isSubmitting ? <LoadingSpinner size="small" className="text-white" /> : 'Sign in'}
          </button>
        </form>

        {/* Footer info */}
        <div className="border-t border-gray-100 pt-4 text-center">
          <p className="text-xs text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-green-600 hover:text-green-700">
              Register as Donor, NGO, or Scrap Dealer
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
