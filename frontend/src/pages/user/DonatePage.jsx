import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { DONATION_CATEGORIES, DONATION_CONDITIONS } from '../../utils/constants';
import ImageUpload from '../../components/common/ImageUpload';
import LiveLocationButton from '../../components/common/LiveLocationButton';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';

const DonatePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    itemName: '',
    category: DONATION_CATEGORIES[0],
    description: '',
    condition: DONATION_CONDITIONS[0],
    quantity: 1,
    address: user?.address || '',
    city: user?.city || '',
    pincode: user?.pincode || '',
    pickupDate: '',
    notes: '',
    image: null
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageSelect = (file, dataUrl) => {
    setFormData({ ...formData, image: dataUrl || file });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        item_name: formData.itemName,
        category: formData.category,
        condition_state: formData.condition,
        quantity: parseInt(formData.quantity, 10) || 1,
        description: formData.description,
        address: formData.address,
        city: formData.city,
        pincode: formData.pincode,
        pickup_date: formData.pickupDate || null,
        additional_notes: formData.notes || null,
        image: typeof formData.image === 'string' ? formData.image : undefined,
        image_url: typeof formData.image === 'string' ? formData.image : undefined
      };

      if (formData.image instanceof File) {
        const data = new FormData();
        Object.entries(payload).forEach(([k, v]) => {
          if (v !== null && v !== undefined) data.append(k, v);
        });
        data.append('image', formData.image);
        await api.post('/donations', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/donations', payload);
      }

      toast.success('Donation request created successfully!');
      navigate('/my-requests');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit donation request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Donate an Item</h1>
        <p className="text-gray-500">Fill in the details of the item you wish to donate.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Item Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-100">Item Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <ImageUpload 
                  onImageSelect={handleImageSelect} 
                  label="Item Photo (Required)" 
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                <input required type="text" name="itemName" value={formData.itemName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" placeholder="e.g. Wooden Dining Table" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500">
                  {DONATION_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                <select name="condition" value={formData.condition} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500">
                  {DONATION_CONDITIONS.map(cond => <option key={cond} value={cond}>{cond}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input required type="number" min="1" name="quantity" value={formData.quantity} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea required name="description" rows="3" value={formData.description} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" placeholder="Describe the item, any damages, brand, dimensions, etc."></textarea>
              </div>
            </div>
          </div>

          {/* Pickup Details */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-2 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Pickup Details</h3>
                <p className="text-xs text-gray-500">Provide address or auto-detect using GPS</p>
              </div>
              <LiveLocationButton
                color="green"
                label="Share Live Location"
                onLocationDetected={(loc) => {
                  setFormData(prev => ({
                    ...prev,
                    address: loc.address || prev.address,
                    city: loc.city || prev.city,
                    pincode: loc.pincode || prev.pincode
                  }));
                }}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Address</label>
                <input required type="text" name="address" value={formData.address} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input required type="text" name="city" value={formData.city} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                <input required type="text" name="pincode" value={formData.pincode} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Pickup Date</label>
                <input required type="date" name="pickupDate" value={formData.pickupDate} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" min={new Date().toISOString().split('T')[0]} />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes for NGO (Optional)</label>
                <input type="text" name="notes" value={formData.notes} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" placeholder="e.g. Call before arriving, use back gate" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 mr-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-70"
            >
              {loading ? 'Submitting...' : 'Submit Donation Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DonatePage;
