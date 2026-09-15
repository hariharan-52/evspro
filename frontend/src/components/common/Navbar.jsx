import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, Menu, X, Bell } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useNotifications from '../../hooks/useNotifications';
import NotificationPanel from './NotificationPanel';

const Navbar = ({ toggleSidebar, isDashboard }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'ngo') return '/ngo/dashboard';
    if (user.role === 'scrapdealer') return '/dealer/dashboard';
    return '/dashboard';
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {isDashboard && (
              <button onClick={toggleSidebar} className="mr-4 lg:hidden text-gray-500 hover:text-green-600 focus:outline-none">
                <Menu size={24} />
              </button>
            )}
            <Link to="/" className="flex items-center gap-2">
              <Leaf className="h-8 w-8 text-green-600" />
              <span className="text-xl font-bold text-green-700">EcoDonate</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:space-x-8">
            {!isDashboard && (
              <>
                <Link to="/" className="text-gray-700 hover:text-green-600 font-medium">Home</Link>
                <Link to="/about" className="text-gray-700 hover:text-green-600 font-medium">About</Link>
                <Link to="/how-it-works" className="text-gray-700 hover:text-green-600 font-medium">How It Works</Link>
                <Link to="/contact" className="text-gray-700 hover:text-green-600 font-medium">Contact</Link>
              </>
            )}
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <button onClick={() => setShowNotifications(!showNotifications)} className="text-gray-500 hover:text-green-600 relative focus:outline-none">
                    <Bell size={24} />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
                </div>
                {!isDashboard && (
                  <Link to={getDashboardLink()} className="text-gray-700 hover:text-green-600 font-medium">Dashboard</Link>
                )}
                <button onClick={handleLogout} className="text-gray-700 hover:text-green-600 font-medium">Logout</button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-gray-700 hover:text-green-600 font-medium">Login</Link>
                <Link to="/register" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            {isAuthenticated && (
              <button onClick={() => setShowNotifications(!showNotifications)} className="text-gray-500 hover:text-green-600 relative focus:outline-none mr-4">
                <Bell size={24} />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-500 hover:text-green-600 focus:outline-none">
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 px-4 pt-2 pb-4 space-y-2 shadow-lg">
          {!isDashboard && (
            <>
              <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-600 hover:bg-green-50">Home</Link>
              <Link to="/about" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-600 hover:bg-green-50">About</Link>
              <Link to="/how-it-works" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-600 hover:bg-green-50">How It Works</Link>
              <Link to="/contact" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-600 hover:bg-green-50">Contact</Link>
            </>
          )}
          {isAuthenticated ? (
            <>
              <Link to={getDashboardLink()} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-600 hover:bg-green-50">Dashboard</Link>
              <button onClick={handleLogout} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-600 hover:bg-green-50">Logout</button>
            </>
          ) : (
            <div className="mt-4 border-t border-gray-100 pt-4 flex flex-col space-y-2">
              <Link to="/login" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-600 hover:bg-green-50">Login</Link>
              <Link to="/register" className="block px-3 py-2 rounded-md text-base font-medium text-white bg-green-600 hover:bg-green-700 text-center">Register</Link>
            </div>
          )}
        </div>
      )}
      {showNotifications && isMobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 z-50">
           <NotificationPanel onClose={() => setShowNotifications(false)} />
        </div>
      )}
    </nav>
  );
};

export default Navbar;
