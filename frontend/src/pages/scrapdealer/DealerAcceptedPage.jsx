import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Truck, CheckCircle, X, Image as ImageIcon, MapPin, History, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ItemImage from '../../components/common/ItemImage';
import { formatDate, getItemImageUrl } from '../../utils/helpers';

const DealerAcceptedPage = () => {
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
      const res = await api.get('/recycling');
      const data = Array.isArray(res.data) ? res.data : [];
      // Active pickups: ACCEPTED or PICKUP_SCHEDULED
      const accepted = data.filter(r => r.status === 'ACCEPTED' || r.status === 'PICKUP_SCHEDULED');
      setRequests(accepted);
    } catch (err) {
      toast.error('Failed to load active recycling jobs');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await api.patch(`/recycling/${id}/status`, { 
        status: newStatus,
        notes: newStatus === 'COLLECTED' ? 'Materials collected from donor and weighed at facility.' : 'Processing Completed'
      });
      if (newStatus === 'COLLECTED') {
        toast.success('Job marked as Collected! Added to your Collection History.', { duration: 4000 });
      } else {
        toast.success(`Job marked as ${newStatus}`);
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
          <h1 className="text-2xl font-bold text-gray-900">Active Recycling Pickups</h1>
          <p className="text-gray-500 text-sm mt-1">Track collections and view material photos for accepted recycling jobs.</p>
        </div>
        <Link
          to="/dealer/history"
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold text-xs rounded-xl border border-teal-200 transition-colors shadow-xs"
        >
          <History size={16} />
          <span>View Collection History</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 flex justify-center"><LoadingSpinner size="large" /></div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Scrap Photo</th>
                  <th className="px-6 py-4">Material & Weight</th>
                  <th className="px-6 py-4">User Contact</th>
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
                        category={r.waste_category}
                        alt={r.waste_category}
                        title={`Recyclable ${r.waste_category}`}
                        className="w-14 h-14 rounded-xl object-cover"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900 text-sm">{r.waste_category}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{r.quantity} {r.quantity_unit || 'kg'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 text-xs">{r.user_name}</p>
                      <p className="text-gray-500 text-xs">{r.user_phone || 'No phone'}</p>
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
                          title="View Details & Scrap Photo"
                        >
                          <Eye size={14} /> View
                        </button>
                        {(r.status === 'ACCEPTED' || r.status === 'PICKUP_SCHEDULED') && (
                          <button
                            onClick={() => handleStatusUpdate(r.id, 'COLLECTED')}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs"
                            title="Mark as Collected"
                          >
                            <Truck size={14} /> Collected
                          </button>
                        )}
                        {r.status === 'COLLECTED' && (
                          <button
                            onClick={() => handleStatusUpdate(r.id, 'COMPLETED')}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs"
                            title="Complete Processing"
                          >
                            <CheckCircle size={14} /> Complete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      <p className="font-medium">No active pickups in progress.</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Check <Link to="/dealer/requests" className="text-teal-600 font-semibold underline">New Scrap Leads</Link> or view past <Link to="/dealer/history" className="text-purple-600 font-semibold underline">Collection History</Link>.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedReq && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50/80">
              <h3 className="font-bold text-gray-900">Recycling Job Details ({selectedReq.request_id})</h3>
              <button onClick={() => setSelectedReq(null)} className="p-1 text-gray-400 hover:text-gray-700"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="relative rounded-xl overflow-hidden bg-gray-900/5 border border-gray-200">
                <ItemImage
                  src={selectedReq.image}
                  category={selectedReq.waste_category}
                  alt={selectedReq.waste_category}
                  title={`Scrap ${selectedReq.waste_category}`}
                  subtitle={`Ref #${selectedReq.request_id} • Quantity: ${selectedReq.quantity} ${selectedReq.quantity_unit || 'kg'}`}
                  quantity={`${selectedReq.quantity} ${selectedReq.quantity_unit || 'kg'}`}
                  className="w-full h-60 object-cover sm:object-contain bg-gray-950/10 cursor-pointer"
                  containerClassName="w-full block"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div><span className="block text-gray-500 text-xs">Material</span><span className="font-bold text-gray-900">{selectedReq.waste_category}</span></div>
                <div><span className="block text-gray-500 text-xs">Quantity / Weight</span><span className="font-bold text-teal-700">{selectedReq.quantity} {selectedReq.quantity_unit || 'kg'}</span></div>
                <div className="col-span-2"><span className="block text-gray-500 text-xs">Description</span><span className="text-gray-700 text-xs">{selectedReq.description || 'No description'}</span></div>
                <div className="col-span-2 border-t pt-3"><span className="block text-gray-500 text-xs">Pickup Address</span><span className="text-gray-900 text-xs font-medium">{selectedReq.address}, {selectedReq.city} - {selectedReq.pincode}</span></div>
                <div><span className="block text-gray-500 text-xs">User</span><span className="font-medium text-xs">{selectedReq.user_name}</span></div>
                <div><span className="block text-gray-500 text-xs">Status</span><StatusBadge status={selectedReq.status} /></div>
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button onClick={() => setSelectedReq(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealerAcceptedPage;
