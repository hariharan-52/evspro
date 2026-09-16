import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { RECYCLING_CATEGORIES } from '../../utils/constants';
import ImageUpload from '../../components/common/ImageUpload';
import LiveLocationButton from '../../components/common/LiveLocationButton';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';
import { Bot, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const RecyclePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  
  const [formData, setFormData] = useState({
    category: RECYCLING_CATEGORIES[0],
    description: '',
    quantity: '',
    unit: 'kg',
    address: user?.address || '',
    city: user?.city || '',
    pincode: user?.pincode || '',
    pickupDate: '',
    image: null
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageSelect = (file, dataUrl) => {
    setFormData({ ...formData, image: dataUrl || file });
    if (file || dataUrl) {
      simulateAiClassification();
    } else {
      setAiResult(null);
    }
  };

  const simulateAiClassification = () => {
    setAiAnalyzing(true);
    setAiResult(null);
    setTimeout(() => {
      setAiAnalyzing(false);
      const mockResult = {
        detected: 'Plastic',
        confidence: 92
      };
      setAiResult(mockResult);
      setFormData(prev => ({ ...prev, category: mockResult.detected }));
      toast.success('AI classification complete!');
    }, 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        waste_category: formData.category,
        description: formData.description || '',
        quantity: parseFloat(formData.quantity) || 1,
        quantity_unit: formData.unit,
        address: formData.address,
        city: formData.city,
        pincode: formData.pincode,
        pickup_date: formData.pickupDate || null,
        ai_prediction: aiResult ? aiResult.detected : null,
        ai_confidence: aiResult ? aiResult.confidence : null,
        image: typeof formData.image === 'string' ? formData.image : undefined,
        image_url: typeof formData.image === 'string' ? formData.image : undefined
      };

      if (formData.image instanceof File) {
        const data = new FormData();
        Object.entries(payload).forEach(([k, v]) => {
          if (v !== null && v !== undefined) data.append(k, v);
        });
        data.append('image', formData.image);
        await api.post('/recycling', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/recycling', payload);
      }

      toast.success('Recycling request created successfully!');
      navigate('/my-requests');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit recycling request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Recycle Waste</h1>
        <p className="text-gray-500">Upload a photo and let our AI classify your recyclable waste.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* AI Upload Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center">
              <Bot className="mr-2 text-teal-600" /> AI Classification
            </h3>
            
            <div className="mb-6">
              <ImageUpload 
                onImageSelect={handleImageSelect} 
                label="Upload Waste Photo for AI Detection" 
              />
            </div>

            {aiAnalyzing && (
              <div className="bg-teal-50 border border-teal-100 rounded-lg p-6 text-center">
                <LoadingSpinner size="medium" className="mb-3 mx-auto text-teal-600" />
                <p className="text-teal-800 font-medium">Detecting waste type...</p>
                <p className="text-teal-600 text-sm mt-1">Our AI is analyzing the image</p>
              </div>
            )}

            {aiResult && !aiAnalyzing && (
              <div className="bg-gradient-to-r from-teal-50 to-green-50 border border-teal-100 rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-teal-900 font-bold mb-1 flex items-center">
                      <CheckCircle2 className="w-5 h-5 mr-2 text-teal-600" />
                      Detection Complete
                    </h4>
                    <p className="text-teal-800 text-sm">We think this is <span className="font-bold">{aiResult.detected}</span>.</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block bg-teal-200 text-teal-800 text-xs px-2 py-1 rounded-full font-bold">
                      {aiResult.confidence}% Confidence
                    </span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-teal-200/50 flex items-center text-sm text-teal-700">
                  <AlertCircle size={16} className="mr-1.5" />
                  You can manually override the category below if incorrect.
                </div>
              </div>
            )}
          </div>

          {/* Waste Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-100">Waste Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Waste Category</label>
                <select name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500">
                  {RECYCLING_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Quantity</label>
                <input required type="number" min="1" step="0.1" name="quantity" value={formData.quantity} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500" placeholder="e.g. 5" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <select name="unit" value={formData.unit} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500">
                  <option value="kg">Kilograms (kg)</option>
                  <option value="pieces">Pieces / Items</option>
                  <option value="lbs">Pounds (lbs)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Brief Description (Optional)</label>
                <textarea name="description" rows="2" value={formData.description} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500" placeholder="e.g. Mixed plastic bottles and containers"></textarea>
              </div>
            </div>
          </div>

          {/* Pickup Details */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-2 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Pickup Details</h3>
                <p className="text-xs text-gray-500">Provide scrap collection address or auto-detect with GPS</p>
              </div>
              <LiveLocationButton
                color="teal"
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
                <input required type="text" name="address" value={formData.address} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input required type="text" name="city" value={formData.city} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                <input required type="text" name="pincode" value={formData.pincode} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Pickup Date</label>
                <input required type="date" name="pickupDate" value={formData.pickupDate} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500" min={new Date().toISOString().split('T')[0]} />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button type="button" onClick={() => navigate('/dashboard')} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 mr-4">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-70">
              {loading ? 'Submitting...' : 'Submit Recycling Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Simple inline component for icon
const CheckCircle2 = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><polyline points="9 11 12 14 22 4"></polyline></svg>
);

export default RecyclePage;
