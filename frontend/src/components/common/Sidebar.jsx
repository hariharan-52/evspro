import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Heart, Recycle, List, BarChart3, User, Settings, X, 
  Users, Building2, Truck, FileText, History
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { generateAvatarUrl } from '../../utils/helpers';

const Sidebar = ({ open, setOpen }) => {
  const { user } = useAuth();

  const getNavItems = () => {
    switch (user?.role) {
      case 'user':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
          { name: 'Donate Item', path: '/donate', icon: <Heart size={20} /> },
          { name: 'Recycle Waste', path: '/recycle', icon: <Recycle size={20} /> },
          { name: 'My Requests', path: '/my-requests', icon: <List size={20} /> },
          { name: 'My Impact', path: '/impact', icon: <BarChart3 size={20} /> },
          { name: 'Profile', path: '/profile', icon: <User size={20} /> },
        ];
      case 'ngo':
        return [
          { name: 'Dashboard', path: '/ngo/dashboard', icon: <LayoutDashboard size={20} /> },
          { name: 'New Requests', path: '/ngo/requests', icon: <List size={20} /> },
          { name: 'In Progress', path: '/ngo/accepted', icon: <Heart size={20} /> },
          { name: 'Received History', path: '/ngo/history', icon: <History size={20} /> },
          { name: 'Profile', path: '/ngo/profile', icon: <User size={20} /> },
        ];
      case 'scrapdealer':
        return [
          { name: 'Dashboard', path: '/dealer/dashboard', icon: <LayoutDashboard size={20} /> },
          { name: 'New Requests', path: '/dealer/requests', icon: <List size={20} /> },
          { name: 'In Progress', path: '/dealer/accepted', icon: <Truck size={20} /> },
          { name: 'Collection History', path: '/dealer/history', icon: <History size={20} /> },
          { name: 'Profile', path: '/dealer/profile', icon: <User size={20} /> },
        ];
      case 'admin':
        return [
          { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
          { name: 'Users', path: '/admin/users', icon: <Users size={20} /> },
          { name: 'NGOs', path: '/admin/ngos', icon: <Building2 size={20} /> },
          { name: 'Scrap Dealers', path: '/admin/scrap-dealers', icon: <Truck size={20} /> },
          { name: 'Donations', path: '/admin/donations', icon: <Heart size={20} /> },
          { name: 'Recycling', path: '/admin/recycling', icon: <Recycle size={20} /> },
          { name: 'Reports', path: '/admin/reports', icon: <FileText size={20} /> },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setOpen(false)}
        ></div>
      )}

      {/* Sidebar component */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-green-800 text-white transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* User Info Header */}
          <div className="p-6 border-b border-green-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={generateAvatarUrl(user?.name)} 
                alt="Avatar" 
                className="w-10 h-10 rounded-full border-2 border-green-500"
              />
              <div className="flex flex-col overflow-hidden">
                <span className="font-semibold truncate">{user?.name}</span>
                <span className="text-xs text-green-300 capitalize">{user?.role}</span>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="lg:hidden text-green-300 hover:text-white focus:outline-none">
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium ${
                    isActive 
                      ? 'bg-green-700 text-white' 
                      : 'text-green-100 hover:bg-green-700 hover:text-white'
                  }`
                }
              >
                {item.icon}
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* Settings/Logout pinned to bottom */}
          <div className="p-4 border-t border-green-700">
             <div className="text-sm text-green-400 text-center">
                EcoDonate v1.0
             </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
