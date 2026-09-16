import React, { useState, useEffect } from 'react';
import { Eye, X, Image as ImageIcon, MapPin, Sparkles } from 'lucide-react';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ItemImage from '../../components/common/ItemImage';
import { formatDate, getItemImageUrl } from '../../utils/helpers';
import { RECYCLING_CATEGORIES, RECYCLING_STATUSES } from '../../utils/constants';

const AdminRecyclingPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedReq, setSelectedReq] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, categoryFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/recycling');
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = requests.filter(r => {
    if (statusFilter !== 'all' && r.status?.toUpperCase() !== statusFilter.toUpperCase()) return false;
    if (categoryFilter !== 'all' && r.waste_category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Recycling Requests Monitor</h1>
        <p className="text-gray-500 text-sm mt-1">Inspect all user recycling scrap submissions, uploaded photos, AI detections, and scrap dealer allocations.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-3 w-full md:w-auto">
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-teal-500 focus:border-teal-500 bg-white"
            >
              <option value="all">All Statuses</option>
              {Object.values(RECYCLING_STATUSES).map(status => (
                <option key={status} value={status.toUpperCase().replace(' ', '_')}>{status}</option>
              ))}
            </select>
            <select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-teal-500 focus:border-teal-500 bg-white"
            >
              <option value="all">All Categories</option>
              {RECYCLING_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <span className="text-xs text-gray-500 font-medium">Total: {filtered.length} requests</span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 flex justify-center"><LoadingSpinner size="large" /></div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Scrap Photo</th>
                  <th className="px-6 py-4">Request ID</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Material & Weight</th>
                  <th className="px-6 py-4">Assigned Dealer</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <ItemImage
                        src={r.image}
                        category={r.waste_category}
                        alt={r.waste_category}
                        title={`Recyclable ${r.waste_category}`}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-bold text-gray-700">{r.request_id}</td>
                    <td className="px-6 py-4 text-gray-900 font-medium text-xs">{r.user_name}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900 text-sm">{r.waste_category}</p>
                      <p className="text-gray-500 text-xs">{r.quantity} {r.quantity_unit || 'kg'}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-700 text-xs">
                      {r.dealer_name ? <span className="text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">{r.dealer_name}</span> : <span className="text-gray-400 italic">Unassigned</span>}
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={r.status} /></td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{formatDate(r.created_at)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedReq(r)}
                        className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                        title="View Scrap Photo & Details"
                      >
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">No recycling requests found.</td>
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
              <button onClick={() => setSelectedReq(null)} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="relative rounded-xl overflow-hidden bg-gray-900/5 border border-gray-200">
                <ItemImage
                  src={selectedReq.image}
                  category={selectedReq.waste_category}
                  alt={selectedReq.waste_category}
                  title={`Scrap ${selectedReq.waste_category}`}
                  subtitle={`Ref #${selectedReq.request_id} • User: ${selectedReq.user_name || 'User'}`}
                  quantity={`${selectedReq.quantity} ${selectedReq.quantity_unit || 'kg'}`}
                  className="w-full h-64 object-cover sm:object-contain bg-gray-950/10 cursor-pointer"
                  containerClassName="w-full block"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div><span className="block text-gray-500 text-xs">Material</span><span className="font-bold text-gray-900">{selectedReq.waste_category}</span></div>
                <div><span className="block text-gray-500 text-xs">Quantity / Weight</span><span className="font-bold text-teal-700">{selectedReq.quantity} {selectedReq.quantity_unit || 'kg'}</span></div>
                <div className="col-span-2"><span className="block text-gray-500 text-xs">Description</span><span className="text-gray-700 text-xs">{selectedReq.description || 'No description'}</span></div>
                <div className="col-span-2 border-t pt-3"><span className="block text-gray-500 text-xs">Pickup Address</span><span className="text-gray-900 text-xs font-medium">{selectedReq.address}, {selectedReq.city} - {selectedReq.pincode}</span></div>
                <div><span className="block text-gray-500 text-xs">User</span><span className="font-medium text-xs">{selectedReq.user_name}</span></div>
                <div><span className="block text-gray-500 text-xs">Assigned Dealer</span><span className="font-bold text-xs text-purple-700">{selectedReq.dealer_name || 'Unassigned'}</span></div>
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 text-right">
              <button onClick={() => setSelectedReq(null)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-semibold text-gray-800">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRecyclingPage;
