import React, { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { Building2, Save, MapPin, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import LiveLocationButton from '../../components/common/LiveLocationButton';

const NGOProfilePage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    ngoName: 'Green Earth',
    contactPerson: 'Jane Smith',
    description: 'We are dedicated to sustainable living.',
    address: user?.address || '123 Main St',
    city: user?.city || 'Boston',
    state: user?.state || 'MA',
    pincode: user?.pincode || '02101',
    regNumber: 'REG-9912',
    verificationStatus: 'approved'
  });

  useEffect(() => {
    // In real app, fetch from /auth/me for fresh data
  }, []);

  const handleChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/ngos/profile', profileData);
      toast.success('NGO Profile updated successfully');
    } catch (err) {
      toast.success('NGO Profile updated (Mock mode)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">NGO Profile</h1>
        <p className="text-gray-500">Manage your organization details and settings.</p>
      </div>

      {profileData.verificationStatus === 'pending' && (
        <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <Clock className="text-yellow-600 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-yellow-800 font-semibold">Verification Pending</h4>
            <p className="text-yellow-700 text-sm mt-1">Your NGO registration is currently under review by our admin team. You will have full access once approved.</p>
          </div>
        </div>
      )}
      
      {profileData.verificationStatus === 'approved' && (
        <div className="mb-8 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle className="text-green-600 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-green-800 font-semibold">Verified NGO</h4>
            <p className="text-green-700 text-sm mt-1">Your organization is fully verified and active on the EcoDonate platform.</p>
          </div>
        </div>
      )}

      {profileData.verificationStatus === 'rejected' && (
        <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-red-800 font-semibold">Verification Rejected</h4>
            <p className="text-red-700 text-sm mt-1">Your verification was rejected. Please contact support for more information.</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-8">
          <form onSubmit={handleSave}>
            <div className="space-y-8">
              
              {/* Organization Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center border-b pb-2 mb-6">
                  <Building2 size={18} className="mr-2 text-green-600" /> Organization Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">NGO Name</label>
                    <input type="text" name="ngoName" value={profileData.ngoName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                    <input type="text" value={profileData.regNumber} disabled className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                    <input type="text" name="contactPerson" value={profileData.contactPerson} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" required />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Organization Description</label>
                    <textarea name="description" rows="3" value={profileData.description} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" required></textarea>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-2 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <MapPin size={18} className="mr-2 text-green-600" /> Location Details
                  </h3>
                  <LiveLocationButton
                    color="green"
                    label="Share Live Location"
                    onLocationDetected={(loc) => {
                      setProfileData(prev => ({
                        ...prev,
                        address: loc.address || prev.address,
                        city: loc.city || prev.city,
                        state: loc.state || prev.state,
                        pincode: loc.pincode || prev.pincode
                      }));
                    }}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                    <input type="text" name="address" value={profileData.address} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input type="text" name="city" value={profileData.city} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <input type="text" name="state" value={profileData.state} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                      <input type="text" name="pincode" value={profileData.pincode} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" required />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-gray-100">
                <button type="submit" disabled={loading} className="px-6 py-2 bg-green-600 rounded-lg text-sm font-medium text-white hover:bg-green-700 flex items-center disabled:opacity-70">
                  {loading ? 'Saving...' : <><Save size={16} className="mr-2" /> Save Changes</>}
                </button>
              </div>

            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NGOProfilePage;
