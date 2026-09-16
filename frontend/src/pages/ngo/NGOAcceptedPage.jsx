import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Truck, CheckCircle, X, Image as ImageIcon, MapPin, History, ArrowRight, FileText } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ItemImage from '../../components/common/ItemImage';
import { formatDate, getItemImageUrl } from '../../utils/helpers';

const NGOAcceptedPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/donations');
      const data = Array.isArray(res.data) ? res.data : [];
      // In progress items: ACCEPTED or PICKUP_SCHEDULED
      const accepted = data.filter(r => r.status === 'ACCEPTED' || r.status === 'PICKUP_SCHEDULED');
      setRequests(accepted);
    } catch (err) {
      toast.error('Failed to load donations');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await api.patch(`/donations/${id}/status`, { 
        status: newStatus,
        notes: newStatus === 'RECEIVED' ? 'Item received and verified at NGO facility.' : 'Completed'
      });
      if (newStatus === 'RECEIVED') {
        toast.success('Donation marked as Received! Added to your Received History.', { duration: 4000 });
      } else {
        toast.success(`Request marked as ${newStatus}`);
      }
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">In-Progress Pickups</h1>
          <p className="text-gray-500 text-sm mt-1">Track pending collections for donations accepted by your NGO.</p>
        </div>
        <Link
          to="/ngo/history"
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs rounded-xl border border-purple-200 transition-colors shadow-xs"
        >
          <History size={16} />
          <span>View Received Items History</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 flex justify-center"><LoadingSpinner size="large" /></div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Item Photo</th>
                  <th className="px-6 py-4">Item & Details</th>
                  <th className="px-6 py-4">Donor Info</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <ItemImage
                        src={r.image}
                        category={r.category}
                        alt={r.item_name}
                        title={r.item_name}
                        className="w-14 h-14 rounded-xl object-cover"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900 text-sm">{r.item_name}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="text-gray-500 text-xs">{r.category} &bull; Qty: {r.quantity}</span>
                        {r.additional_notes && (
                          <span className="text-[11px] font-medium px-1.5 py-0.5 bg-amber-50 text-amber-800 rounded border border-amber-200 flex items-center gap-1" title={r.additional_notes}>
                            <FileText size={10} className="text-amber-600" /> Note
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 text-xs">{r.donor_name}</p>
                      <p className="text-gray-500 text-xs">{r.donor_phone || 'No phone'}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-700 text-xs">
                      <span className="flex items-center gap-1 font-medium">
                        <MapPin size={12} className="text-gray-400" />
                        {r.city}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">{formatDate(r.created_at)}</td>
                    <td className="px-6 py-4"><StatusBadge status={r.status} /></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 items-center">
                        <button
                          onClick={() => setSelectedReq(r)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1"
                          title="View Details & Photo"
                        >
                          <Eye size={14} /> View
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(r.id, 'RECEIVED')}
                          disabled={updatingId === r.id}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-colors disabled:opacity-50"
                          title="Mark as Received & Stored"
                        >
                          <Truck size={14} />
                          {updatingId === r.id ? 'Saving...' : 'Mark Received'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      <p className="font-medium">No pending pickups in progress.</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Check <Link to="/ngo/requests" className="text-green-600 font-semibold underline">New Requests</Link> or view past <Link to="/ngo/history" className="text-purple-600 font-semibold underline">Received History</Link>.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50/80">
              <h3 className="font-bold text-gray-900">Donation Item ({selectedReq.request_id})</h3>
              <button onClick={() => setSelectedReq(null)} className="p-1 text-gray-400 hover:text-gray-700"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="relative rounded-xl overflow-hidden bg-gray-900/5 border border-gray-200">
                <ItemImage
                  src={selectedReq.image}
                  category={selectedReq.category}
                  alt={selectedReq.item_name}
                  title={selectedReq.item_name}
                  subtitle={`Ref #${selectedReq.request_id} • Donor: ${selectedReq.donor_name || 'Donor'}`}
                  condition={selectedReq.condition_state}
                  quantity={selectedReq.quantity}
                  className="w-full h-60 object-cover sm:object-contain bg-gray-950/10 cursor-pointer"
                  containerClassName="w-full block"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div><span className="block text-gray-500 text-xs">Item Name</span><span className="font-bold text-gray-900">{selectedReq.item_name}</span></div>
                <div><span className="block text-gray-500 text-xs">Category</span><span className="font-semibold text-green-700">{selectedReq.category}</span></div>
                <div><span className="block text-gray-500 text-xs">Condition</span><span className="font-medium text-gray-800">{selectedReq.condition_state || 'Good'}</span></div>
                <div><span className="block text-gray-500 text-xs">Quantity</span><span className="font-bold text-gray-900">{selectedReq.quantity}</span></div>
                <div className="col-span-2"><span className="block text-gray-500 text-xs">Description</span><span className="text-gray-700 text-xs">{selectedReq.description || 'No description'}</span></div>
                {selectedReq.additional_notes && (
                  <div className="col-span-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <span className="text-amber-800 text-xs font-bold flex items-center gap-1.5">
                      <FileText size={13} className="text-amber-600" /> Additional Notes for NGO
                    </span>
                    <p className="text-amber-900 text-xs mt-1 font-medium bg-white/70 p-2 rounded border border-amber-100">
                      "{selectedReq.additional_notes}"
                    </p>
                  </div>
                )}
                <div className="col-span-2 border-t pt-3"><span className="block text-gray-500 text-xs">Pickup Address</span><span className="text-gray-900 text-xs font-medium">{selectedReq.address}, {selectedReq.city}</span></div>
                <div><span className="block text-gray-500 text-xs">Donor</span><span className="font-medium text-xs">{selectedReq.donor_name}</span></div>
                <div><span className="block text-gray-500 text-xs">Status</span><StatusBadge status={selectedReq.status} /></div>
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
              <button onClick={() => setSelectedReq(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Close</button>
              <button
                onClick={() => {
                  handleStatusUpdate(selectedReq.id, 'RECEIVED');
                  setSelectedReq(null);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-xs flex items-center gap-1.5"
              >
                <Truck size={16} /> Mark as Received
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NGOAcceptedPage;
