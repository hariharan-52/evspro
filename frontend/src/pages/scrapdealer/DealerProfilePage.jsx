import React, { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { Truck, Save, MapPin, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { RECYCLING_CATEGORIES } from '../../utils/constants';
import LiveLocationButton from '../../components/common/LiveLocationButton';

const DealerProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const parseMaterials = (raw) => {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        return raw.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    return ['Plastic', 'Paper', 'Metal'];
  };

  const [profileData, setProfileData] = useState({
    businessName: user?.scrap_dealer_details?.business_name || user?.name || '',
    contactPerson: user?.scrap_dealer_details?.contact_person || user?.name || '',
    acceptedMaterials: parseMaterials(user?.scrap_dealer_details?.accepted_materials),
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    pincode: user?.pincode || '',
    regNumber: user?.scrap_dealer_details?.registration_number || 'N/A',
    verificationStatus: user?.scrap_dealer_details?.verification_status || user?.status || 'pending'
  });

  useEffect(() => {
    const loadFreshProfile = async () => {
      try {
        const res = await api.get('/auth/me');
        const u = res.data;
        if (u) {
          setProfileData({
            businessName: u.scrap_dealer_details?.business_name || u.name || '',
            contactPerson: u.scrap_dealer_details?.contact_person || u.name || '',
            acceptedMaterials: parseMaterials(u.scrap_dealer_details?.accepted_materials),
            address: u.address || '',
            city: u.city || '',
            state: u.state || '',
            pincode: u.pincode || '',
            regNumber: u.scrap_dealer_details?.registration_number || 'N/A',
            verificationStatus: u.scrap_dealer_details?.verification_status || u.status || 'pending'
          });
        }
      } catch (err) {
        console.warn('Could not refresh Scrap Dealer profile:', err.message);
      }
    };
    loadFreshProfile();
  }, []);

  const handleChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleMaterialToggle = (material) => {
    setProfileData(prev => ({
      ...prev,
      acceptedMaterials: prev.acceptedMaterials.includes(material)
        ? prev.acceptedMaterials.filter(m => m !== material)
        : [...prev.acceptedMaterials, material]
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/scrap-dealers/profile', {
        business_name: profileData.businessName,
        businessName: profileData.businessName,
        contact_person: profileData.contactPerson,
        contactPerson: profileData.contactPerson,
        accepted_materials: profileData.acceptedMaterials,
        acceptedMaterials: profileData.acceptedMaterials,
        address: profileData.address,
        city: profileData.city,
        state: profileData.state,
        pincode: profileData.pincode
      });
      await refreshUser();
      toast.success('Business Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update business profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dealer Profile</h1>
        <p className="text-gray-500">Manage your business details and accepted materials.</p>
      </div>

      {profileData.verificationStatus === 'pending' && (
        <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <Clock className="text-yellow-600 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-yellow-800 font-semibold">Verification Pending</h4>
            <p className="text-yellow-700 text-sm mt-1">Your dealer registration is currently under review by our admin team. You will have full access to incoming requests once approved.</p>
          </div>
        </div>
      )}
      
      {profileData.verificationStatus === 'approved' && (
        <div className="mb-8 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle className="text-green-600 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-green-800 font-semibold">Verified Dealer</h4>
            <p className="text-green-700 text-sm mt-1">Your business is fully verified and active on the EcoDonate platform.</p>
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
              
              {/* Business Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center border-b pb-2 mb-6">
                  <Truck size={18} className="mr-2 text-green-600" /> Business Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                    <input type="text" name="businessName" value={profileData.businessName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Registration/License Number</label>
                    <input type="text" value={profileData.regNumber} disabled className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                    <input type="text" name="contactPerson" value={profileData.contactPerson} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" required />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Accepted Materials</label>
                    <div className="flex flex-wrap gap-2">
                      {RECYCLING_CATEGORIES.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => handleMaterialToggle(cat)}
                          className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                            profileData.acceptedMaterials.includes(cat) 
                              ? 'bg-green-100 border-green-200 text-green-800 hover:bg-green-200' 
                              : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-2 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <MapPin size={18} className="mr-2 text-teal-600" /> Location Details
                  </h3>
                  <LiveLocationButton
                    color="teal"
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

export default DealerProfilePage;
