import React, { useState, useEffect } from 'react';
import { Eye, Check, X, Truck, CheckCircle, Package, Image as ImageIcon, MapPin, Phone, User, Calendar, FileText } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ItemImage from '../../components/common/ItemImage';
import { formatDate, getItemImageUrl } from '../../utils/helpers';
import { DONATION_STATUSES } from '../../utils/constants';

const NGORequestsPage = () => {
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
      const res = await api.get('/donations');
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error('Failed to load donation requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.patch(`/donations/${id}/status`, { status: newStatus });
      toast.success(`Request marked as ${newStatus}`);
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const filtered = requests.filter(r => {
    if (activeTab === 'ALL') return true;
    return r.status === activeTab;
  });

  const tabs = ['ALL', 'PENDING', 'ACCEPTED', 'PICKUP_SCHEDULED', 'RECEIVED'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="text-green-600" size={28} />
          Donation Requests for NGO
        </h1>
        <p className="text-gray-500 text-sm mt-1">Browse donated items with photos, inspect condition, and accept offers in your area.</p>
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
                  ? 'border-b-2 border-green-600 text-green-600 bg-white shadow-xs' 
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
                  <th className="px-6 py-4">Item Photo</th>
                  <th className="px-6 py-4">Item & Details</th>
                  <th className="px-6 py-4">Condition</th>
                  <th className="px-6 py-4">Donor & Location</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50/80 transition-colors">
                    {/* Item Photo Thumbnail */}
                    <td className="px-6 py-4">
                      <ItemImage
                        src={r.image}
                        category={r.category}
                        alt={r.item_name}
                        title={r.item_name}
                        subtitle={`Category: ${r.category} • Quantity: ${r.quantity}`}
                        className="w-14 h-14 rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      />
                    </td>

                    {/* Item Name & Category */}
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900 text-sm">{r.item_name}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs font-semibold px-2 py-0.5 bg-green-50 text-green-700 rounded-md border border-green-200">
                          {r.category}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">Qty: {r.quantity}</span>
                        {r.additional_notes && (
                          <span className="text-[11px] font-medium px-2 py-0.5 bg-amber-50 text-amber-800 rounded-md border border-amber-200 flex items-center gap-1" title={r.additional_notes}>
                            <FileText size={11} className="text-amber-600" /> Note for NGO
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Condition */}
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-800 rounded-md text-xs font-medium border border-gray-200">
                        {r.condition_state || 'Good'}
                      </span>
                    </td>

                    {/* Donor & City */}
                    <td className="px-6 py-4">
                      <p className="text-gray-900 font-medium text-xs">{r.donor_name || 'Anonymous Donor'}</p>
                      <p className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
                        <MapPin size={12} className="text-gray-400" />
                        {r.city}
                      </p>
                    </td>

                    {/* Status Badge */}
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
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                          title="View Item Photo & Details"
                        >
                          <Eye size={14} /> View
                        </button>
                        {r.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(r.id, 'ACCEPTED')}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
                              title="Accept Donation"
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
                            onClick={() => handleStatusUpdate(r.id, 'RECEIVED')}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                            title="Mark as Received"
                          >
                            <Truck size={14} /> Received
                          </button>
                        )}
                        {r.status === 'RECEIVED' && (
                          <button
                            onClick={() => handleStatusUpdate(r.id, 'COMPLETED')}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                            title="Complete Donation"
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
                      No donation requests found matching this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* View Donation Details Modal with Large Image Display */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center bg-gray-50/80">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Donation Item Details</h3>
                <p className="text-xs text-gray-500 font-mono">Ref ID: {selectedReq.request_id}</p>
              </div>
              <button
                onClick={() => setSelectedReq(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Item Visual Photo Showcase */}
              <div className="relative rounded-xl overflow-hidden bg-gray-900/5 border border-gray-200">
                <img
                  src={getItemImageUrl(selectedReq.image, selectedReq.category)}
                  alt={selectedReq.item_name}
                  className="w-full h-64 object-cover sm:object-contain bg-gray-950/10"
                />
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs text-white px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                  <ImageIcon size={14} />
                  <span>Item Photo from Donor</span>
                </div>
                <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-xs text-gray-900 px-3 py-1 rounded-lg text-xs font-bold shadow-xs">
                  {selectedReq.category} &bull; {selectedReq.condition_state || 'Good'} Condition
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <span className="block text-gray-500 text-xs font-medium">Item Name</span>
                  <span className="font-bold text-gray-900 text-base">{selectedReq.item_name}</span>
                </div>
                <div>
                  <span className="block text-gray-500 text-xs font-medium">Quantity Available</span>
                  <span className="font-bold text-gray-900 text-base">{selectedReq.quantity} unit(s)</span>
                </div>
                <div>
                  <span className="block text-gray-500 text-xs font-medium">Condition State</span>
                  <span className="font-semibold text-green-700">{selectedReq.condition_state || 'Good'}</span>
                </div>
                <div>
                  <span className="block text-gray-500 text-xs font-medium">Current Status</span>
                  <StatusBadge status={selectedReq.status} />
                </div>
                <div className="col-span-2">
                  <span className="block text-gray-500 text-xs font-medium">Item Description</span>
                  <p className="text-gray-700 text-xs leading-relaxed mt-0.5">
                    {selectedReq.description || 'No item description provided.'}
                  </p>
                </div>
                {selectedReq.additional_notes && (
                  <div className="col-span-2 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
                    <span className="text-amber-800 text-xs font-bold flex items-center gap-1.5">
                      <FileText size={14} className="text-amber-600" />
                      Additional Note for NGO
                    </span>
                    <p className="text-amber-900 text-xs mt-1 font-medium leading-relaxed bg-white/70 p-2.5 rounded-lg border border-amber-100">
                      "{selectedReq.additional_notes}"
                    </p>
                  </div>
                )}
                <div className="col-span-2 border-t border-gray-200 pt-3 mt-1">
                  <span className="block text-gray-500 text-xs font-medium">Donor & Pickup Location</span>
                  <p className="text-gray-900 font-medium text-xs mt-0.5">
                    {selectedReq.donor_name} {selectedReq.donor_phone && `(${selectedReq.donor_phone})`}
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
                  className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 shadow-sm flex items-center gap-1.5"
                >
                  <Check size={16} /> Accept Donation
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NGORequestsPage;
