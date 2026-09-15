import React, { useState, useEffect } from 'react';
import { Eye, Check, X, Truck, CheckCircle, Recycle, Image as ImageIcon, MapPin, Sparkles } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ItemImage from '../../components/common/ItemImage';
import { formatDate, getItemImageUrl } from '../../utils/helpers';
import { RECYCLING_STATUSES } from '../../utils/constants';

const DealerRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedReq, setSelectedReq] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/recycling');
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error('Failed to load recycling requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.patch(`/recycling/${id}/status`, { status: newStatus });
      toast.success(`Job marked as ${newStatus}`);
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const filtered = requests.filter(r => {
    if (activeTab === 'ALL') return true;
    return r.status === activeTab;
  });

  const tabs = ['ALL', 'PENDING', 'ACCEPTED', 'PICKUP_SCHEDULED', 'COLLECTED'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Recycle className="text-teal-600" size={28} />
          Recycling Requests for Scrap Dealer
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Inspect photos of recyclable scrap items uploaded by users and donors before picking up.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tab filters */}
        <div className="flex border-b border-gray-100 overflow-x-auto bg-gray-50/50">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab 
                  ? 'border-b-2 border-teal-600 text-teal-600 bg-white shadow-xs' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/60'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 flex justify-center"><LoadingSpinner size="large" /></div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Scrap Photo</th>
                  <th className="px-6 py-4">Material & Weight</th>
                  <th className="px-6 py-4">AI Verification</th>
                  <th className="px-6 py-4">User & Location</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50/80 transition-colors">
                    {/* Material Photo */}
                    <td className="px-6 py-4">
                      <ItemImage
                        src={r.image}
                        category={r.waste_category}
                        alt={r.waste_category}
                        title={`Recyclable ${r.waste_category}`}
                        subtitle={`Quantity: ${r.quantity} ${r.quantity_unit || 'kg'}`}
                        className="w-14 h-14 rounded-xl object-cover cursor-pointer hover:opacity-90"
                      />
                    </td>

                    {/* Material & Quantity */}
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900 text-sm">{r.waste_category}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-semibold px-2 py-0.5 bg-teal-50 text-teal-700 rounded-md border border-teal-200">
                          {r.quantity} {r.quantity_unit || 'kg'}
                        </span>
                      </div>
                    </td>

                    {/* AI Verification */}
                    <td className="px-6 py-4">
                      {r.ai_prediction ? (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-semibold border border-purple-200">
                          <Sparkles size={12} className="text-purple-600" />
                          <span>{r.ai_prediction} ({r.ai_confidence || 90}%)</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Manual Entry</span>
                      )}
                    </td>

                    {/* User & Location */}
                    <td className="px-6 py-4">
                      <p className="text-gray-900 font-medium text-xs">{r.user_name || 'Donor / User'}</p>
                      <p className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
                        <MapPin size={12} className="text-gray-400" />
                        {r.city}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <StatusBadge status={r.status} />
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {formatDate(r.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 items-center">
                        <button
                          onClick={() => setSelectedReq(r)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1"
                          title="Inspect Photo & Details"
                        >
                          <Eye size={14} /> View
                        </button>
                        {r.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(r.id, 'ACCEPTED')}
                              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs"
                              title="Accept Scrap Job"
                            >
                              <Check size={14} /> Accept
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(r.id, 'REJECTED')}
                              className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg"
                              title="Ignore"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                        {(r.status === 'ACCEPTED' || r.status === 'PICKUP_SCHEDULED') && (
                          <button
                            onClick={() => handleStatusUpdate(r.id, 'COLLECTED')}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                            title="Mark as Collected"
                          >
                            <Truck size={14} /> Collected
                          </button>
                        )}
                        {r.status === 'COLLECTED' && (
                          <button
                            onClick={() => handleStatusUpdate(r.id, 'COMPLETED')}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                            title="Complete Job"
                          >
                            <CheckCircle size={14} /> Complete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      No recycling requests found matching this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* View Recycling Details Modal with Photo Showcase */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center bg-gray-50/80">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Recyclable Scrap Details</h3>
                <p className="text-xs text-gray-500 font-mono">Job ID: {selectedReq.request_id}</p>
              </div>
              <button onClick={() => setSelectedReq(null)} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg">
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Scrap Material Photo Showcase */}
              <div className="relative rounded-xl overflow-hidden bg-gray-900/5 border border-gray-200">
                <img
                  src={getItemImageUrl(selectedReq.image, selectedReq.waste_category)}
                  alt={selectedReq.waste_category}
                  className="w-full h-64 object-cover sm:object-contain bg-gray-950/10"
                />
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs text-white px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                  <ImageIcon size={14} />
                  <span>Scrap Photo from User</span>
                </div>
                {selectedReq.ai_prediction && (
                  <div className="absolute top-3 right-3 bg-purple-600/90 backdrop-blur-xs text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs">
                    <Sparkles size={12} />
                    <span>AI Detected: {selectedReq.ai_prediction} ({selectedReq.ai_confidence || 90}%)</span>
                  </div>
                )}
                <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-xs text-gray-900 px-3 py-1 rounded-lg text-xs font-bold shadow-xs">
                  {selectedReq.quantity} {selectedReq.quantity_unit || 'kg'} &bull; {selectedReq.waste_category}
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <span className="block text-gray-500 text-xs font-medium">Waste Category</span>
                  <span className="font-bold text-gray-900 text-base">{selectedReq.waste_category}</span>
                </div>
                <div>
                  <span className="block text-gray-500 text-xs font-medium">Quantity / Weight</span>
                  <span className="font-bold text-gray-900 text-base">{selectedReq.quantity} {selectedReq.quantity_unit || 'kg'}</span>
                </div>
                <div>
                  <span className="block text-gray-500 text-xs font-medium">AI Classification</span>
                  <span className="font-semibold text-purple-700">
                    {selectedReq.ai_prediction ? `${selectedReq.ai_prediction} (${selectedReq.ai_confidence}%)` : 'Not run'}
                  </span>
                </div>
                <div>
                  <span className="block text-gray-500 text-xs font-medium">Current Status</span>
                  <StatusBadge status={selectedReq.status} />
                </div>
                <div className="col-span-2">
                  <span className="block text-gray-500 text-xs font-medium">User Description / Notes</span>
                  <p className="text-gray-700 text-xs leading-relaxed mt-0.5">
                    {selectedReq.description || 'No additional description provided.'}
                  </p>
                </div>
                <div className="col-span-2 border-t border-gray-200 pt-3 mt-1">
                  <span className="block text-gray-500 text-xs font-medium">Pickup & User Contact</span>
                  <p className="text-gray-900 font-medium text-xs mt-0.5">
                    {selectedReq.user_name} {selectedReq.user_phone && `(${selectedReq.user_phone})`}
                  </p>
                  <p className="text-gray-600 text-xs mt-0.5">
                    {selectedReq.address}, {selectedReq.city} - {selectedReq.pincode}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
              <button
                onClick={() => setSelectedReq(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Close
              </button>
              {selectedReq.status === 'PENDING' && (
                <button
                  onClick={() => {
                    handleStatusUpdate(selectedReq.id, 'ACCEPTED');
                    setSelectedReq(null);
                  }}
                  className="px-5 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 shadow-sm flex items-center gap-1.5"
                >
                  <Check size={16} /> Accept Recycling Job
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealerRequestsPage;
