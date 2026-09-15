import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import useAuth from '../hooks/useAuth';

const UnauthorizedPage = () => {
  const { user } = useAuth();
  
  const getHomeLink = () => {
    if (!user) return '/';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'ngo') return '/ngo/dashboard';
    if (user.role === 'scrapdealer') return '/dealer/dashboard';
    return '/dashboard';
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <ShieldAlert className="w-24 h-24 text-red-400 mb-6" />
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Access Denied</h1>
      <p className="text-gray-600 mb-8 max-w-md">
        You do not have permission to view this page. Please ensure you are logged in with the correct account type.
      </p>
      <Link 
        to={getHomeLink()} 
        className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-8 rounded-full transition-colors"
      >
        Go to Dashboard
      </Link>
    </div>
  );
};

export default UnauthorizedPage;
