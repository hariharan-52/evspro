import React, { useState, useEffect } from 'react';
import { Eye, X, Image as ImageIcon, MapPin, FileText } from 'lucide-react';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ItemImage from '../../components/common/ItemImage';
import { formatDate, getItemImageUrl } from '../../utils/helpers';
import { DONATION_CATEGORIES, DONATION_STATUSES } from '../../utils/constants';

const AdminDonationsPage = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedDonation, setSelectedDonation] = useState(null);

  useEffect(() => {
    fetchDonations();
  }, [statusFilter, categoryFilter]);

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/donations');
      setDonations(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setDonations([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredDonations = donations.filter(d => {
    if (statusFilter !== 'all' && d.status?.toUpperCase() !== statusFilter.toUpperCase()) return false;
    if (categoryFilter !== 'all' && d.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Donation Requests Monitor</h1>
        <p className="text-gray-500 text-sm mt-1">Inspect all donor items, photos, condition, and NGO allocations across the platform.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-3 w-full md:w-auto">
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-green-500 focus:border-green-500 bg-white"
            >
              <option value="all">All Statuses</option>
              {Object.values(DONATION_STATUSES).map(status => (
                <option key={status} value={status.toUpperCase().replace(' ', '_')}>{status}</option>
              ))}
            </select>
            <select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-green-500 focus:border-green-500 bg-white"
            >
              <option value="all">All Categories</option>
              {DONATION_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <span className="text-xs text-gray-500 font-medium">Total: {filteredDonations.length} items</span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 flex justify-center"><LoadingSpinner size="large" /></div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Item Photo</th>
                  <th className="px-6 py-4">Request ID</th>
                  <th className="px-6 py-4">Donor</th>
                  <th className="px-6 py-4">Item & Category</th>
                  <th className="px-6 py-4">Assigned NGO</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDonations.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <ItemImage
                        src={d.image}
                        category={d.category}
                        alt={d.item_name}
                        title={d.item_name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-bold text-gray-700">{d.request_id}</td>
                    <td className="px-6 py-4 text-gray-900 font-medium text-xs">{d.donor_name}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900 text-sm">{d.item_name}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="text-gray-500 text-xs">{d.category} &bull; Qty: {d.quantity}</span>
                        {d.additional_notes && (
                          <span className="text-[11px] font-medium px-1.5 py-0.5 bg-amber-50 text-amber-800 rounded border border-amber-200 flex items-center gap-1" title={d.additional_notes}>
                            <FileText size={10} className="text-amber-600" /> Note
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700 text-xs">
                      {d.ngo_name ? <span className="text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded border border-green-200">{d.ngo_name}</span> : <span className="text-gray-400 italic">Unassigned</span>}
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={d.status} /></td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{formatDate(d.created_at)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedDonation(d)}
                        className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                        title="View Photo & Details"
                      >
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredDonations.length === 0 && (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">No donation requests found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedDonation && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50/80">
              <h3 className="font-bold text-gray-900">Donation Details ({selectedDonation.request_id})</h3>
              <button onClick={() => setSelectedDonation(null)} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="relative rounded-xl overflow-hidden bg-gray-900/5 border border-gray-200">
                <img
                  src={getItemImageUrl(selectedDonation.image, selectedDonation.category)}
                  alt={selectedDonation.item_name}
                  className="w-full h-64 object-cover sm:object-contain bg-gray-950/10"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div><span className="block text-gray-500 text-xs">Item Name</span><span className="font-bold text-gray-900">{selectedDonation.item_name}</span></div>
                <div><span className="block text-gray-500 text-xs">Category</span><span className="font-semibold text-green-700">{selectedDonation.category}</span></div>
                <div><span className="block text-gray-500 text-xs">Condition</span><span className="font-medium text-gray-800">{selectedDonation.condition_state}</span></div>
                <div><span className="block text-gray-500 text-xs">Quantity</span><span className="font-bold text-gray-900">{selectedDonation.quantity}</span></div>
                <div className="col-span-2"><span className="block text-gray-500 text-xs">Description</span><span className="text-gray-700 text-xs">{selectedDonation.description || 'No description'}</span></div>
                {selectedDonation.additional_notes && (
                  <div className="col-span-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <span className="text-amber-800 text-xs font-bold flex items-center gap-1.5">
                      <FileText size={13} className="text-amber-600" /> Additional Notes for NGO
                    </span>
                    <p className="text-amber-900 text-xs mt-1 font-medium bg-white/70 p-2 rounded border border-amber-100">
                      "{selectedDonation.additional_notes}"
                    </p>
                  </div>
                )}
                <div className="col-span-2 border-t pt-3"><span className="block text-gray-500 text-xs">Pickup Address</span><span className="text-gray-900 text-xs font-medium">{selectedDonation.address}, {selectedDonation.city} - {selectedDonation.pincode}</span></div>
                <div><span className="block text-gray-500 text-xs">Donor Name</span><span className="font-medium text-xs">{selectedDonation.donor_name}</span></div>
                <div><span className="block text-gray-500 text-xs">Assigned NGO</span><span className="font-bold text-xs text-green-700">{selectedDonation.ngo_name || 'Unassigned'}</span></div>
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 text-right">
              <button onClick={() => setSelectedDonation(null)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-semibold text-gray-800">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDonationsPage;
