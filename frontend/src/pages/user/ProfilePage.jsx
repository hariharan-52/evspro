import React, { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import { generateAvatarUrl } from '../../utils/helpers';
import { toast } from 'react-hot-toast';
import { Save, User, MapPin, Mail, Phone } from 'lucide-react';
import LiveLocationButton from '../../components/common/LiveLocationButton';

const ProfilePage = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    pincode: user?.pincode || '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setIsEditing(false);
      toast.success('Profile updated successfully (Mock)');
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500">Manage your account settings and preferences.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        {/* Header Cover */}
        <div className="h-32 bg-gradient-to-r from-green-600 to-teal-500"></div>
        
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-8">
            <div className="flex items-end space-x-5">
              <img 
                src={generateAvatarUrl(user?.name)} 
                alt="Profile" 
                className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-white"
              />
              <div className="pb-2">
                <h2 className="text-2xl font-bold text-gray-900">{user?.name || 'User Name'}</h2>
                <p className="text-gray-500 capitalize flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                  {user?.role || 'User'} Account
                </p>
              </div>
            </div>
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white shadow-sm mb-2"
              >
                Edit Profile
              </button>
            )}
          </div>

          <form onSubmit={handleSave}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Personal Info */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center border-b pb-2">
                  <User size={18} className="mr-2 text-green-600" /> Personal Information
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input 
                    type="text" name="name" 
                    value={formData.name} onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Mail size={14} className="mr-1 text-gray-400" /> Email Address (Read-only)
                  </label>
                  <input 
                    type="email" 
                    value={user?.email || ''} 
                    disabled
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Phone size={14} className="mr-1 text-gray-400" /> Phone Number
                  </label>
                  <input 
                    type="tel" name="phone" 
                    value={formData.phone} onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500" 
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-2">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <MapPin size={18} className="mr-2 text-green-600" /> Location Details
                  </h3>
                  {isEditing && (
                    <LiveLocationButton
                      color="green"
                      label="Share Live Location"
                      onLocationDetected={(loc) => {
                        setFormData(prev => ({
                          ...prev,
                          address: loc.address || prev.address,
                          city: loc.city || prev.city,
                          state: loc.state || prev.state,
                          pincode: loc.pincode || prev.pincode
                        }));
                      }}
                    />
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                  <input 
                    type="text" name="address" 
                    value={formData.address} onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input 
                    type="text" name="city" 
                    value={formData.city} onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500" 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input 
                      type="text" name="state" 
                      value={formData.state} onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                    <input 
                      type="text" name="pincode" 
                      value={formData.pincode} onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500" 
                    />
                  </div>
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 rounded-lg text-sm font-medium text-white hover:bg-green-700 flex items-center disabled:opacity-70"
                >
                  {loading ? 'Saving...' : <><Save size={16} className="mr-2" /> Save Changes</>}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
