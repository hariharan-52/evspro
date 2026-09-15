import React, { useState, useEffect } from 'react';
import { Eye, X, Image as ImageIcon, MapPin, FileText } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ItemImage from '../../components/common/ItemImage';
import { formatDate, getItemImageUrl } from '../../utils/helpers';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const MyRequestsPage = () => {
  const [activeTab, setActiveTab] = useState('All');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState(null);

  const tabs = ['All', 'Donations', 'Recycling', 'Pending', 'Accepted', 'Completed'];

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const [donationsRes, recyclingRes] = await Promise.all([
        api.get('/donations/my'),
        api.get('/recycling'),
      ]);

      const donations = (Array.isArray(donationsRes.data) ? donationsRes.data : []).map(d => ({
        id: d.id,
        request_id: d.request_id,
        type: 'Donation',
        item: d.item_name,
        category: d.category,
        image: d.image,
        description: d.description,
        additional_notes: d.additional_notes,
        condition: d.condition_state,
        quantity: d.quantity,
        receiver: d.ngo_name || (d.ngo_id ? `NGO #${d.ngo_id}` : 'Pending NGO assignment'),
        status: d.status,
        date: d.created_at,
        address: d.address,
        city: d.city,
        pincode: d.pincode,
      }));

      const recycling = (Array.isArray(recyclingRes.data) ? recyclingRes.data : []).map(r => ({
        id: r.id,
        request_id: r.request_id,
        type: 'Recycling',
        item: `${r.waste_category} (${r.quantity || '?'} ${r.quantity_unit || 'kg'})`,
        category: r.waste_category,
        image: r.image,
        description: r.description,
        condition: '-',
        quantity: r.quantity,
        receiver: r.dealer_name || (r.scrap_dealer_id ? `Dealer #${r.scrap_dealer_id}` : 'Pending dealer assignment'),
        status: r.status,
        date: r.created_at,
        address: r.address,
        city: r.city,
        pincode: r.pincode,
      }));

      const merged = [...donations, ...recycling].sort((a, b) => new Date(b.date) - new Date(a.date));
      setRequests(merged);
    } catch (err) {
      toast.error('Failed to load requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(req => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Donations') return req.type === 'Donation';
    if (activeTab === 'Recycling') return req.type === 'Recycling';
    return req.status?.toUpperCase() === activeTab.toUpperCase();
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Requests & Activities</h1>
        <p className="text-gray-500 text-sm mt-1">Track the pickup status and inspect photos of all your donations and recycling submissions.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tabs */}
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
              {tab}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 flex justify-center"><LoadingSpinner size="large" /></div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Photo</th>
                  <th className="px-6 py-4">Request ID</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Item Details</th>
                  <th className="px-6 py-4">Partner Assigned</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRequests.map((req) => (
                  <tr key={`${req.type}-${req.id}`} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <ItemImage
                        src={req.image}
                        category={req.category}
                        alt={req.item}
                        title={req.item}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-bold text-gray-700">{req.request_id}</td>
                    <td className="px-6 py-4">
                       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${req.type === 'Donation' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-teal-50 text-teal-700 border border-teal-200'}`}>
                          {req.type}
                       </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 text-sm">{req.item}</td>
                    <td className="px-6 py-4 text-gray-600 text-xs">{req.receiver}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{formatDate(req.date)}</td>
                    <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedReq(req)}
                        className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                        title="View Details & Photo"
                      >
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredRequests.length === 0 && (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                      No requests found matching this filter.
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
              <h3 className="font-bold text-gray-900">{selectedReq.type} Details ({selectedReq.request_id})</h3>
              <button onClick={() => setSelectedReq(null)} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="relative rounded-xl overflow-hidden bg-gray-900/5 border border-gray-200">
                <img
                  src={getItemImageUrl(selectedReq.image, selectedReq.category)}
                  alt={selectedReq.item}
                  className="w-full h-60 object-cover sm:object-contain bg-gray-950/10"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div><span className="block text-gray-500 text-xs">Item / Category</span><span className="font-bold text-gray-900">{selectedReq.item}</span></div>
                <div><span className="block text-gray-500 text-xs">Assigned Partner</span><span className="font-semibold text-green-700">{selectedReq.receiver}</span></div>
                {selectedReq.type === 'Donation' && (
                  <div><span className="block text-gray-500 text-xs">Condition</span><span className="font-medium text-gray-800">{selectedReq.condition}</span></div>
                )}
                <div><span className="block text-gray-500 text-xs">Status</span><StatusBadge status={selectedReq.status} /></div>
                <div className="col-span-2"><span className="block text-gray-500 text-xs">Description</span><span className="text-gray-700 text-xs">{selectedReq.description || 'No description'}</span></div>
                {selectedReq.additional_notes && (
                  <div className="col-span-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <span className="text-amber-800 text-xs font-bold flex items-center gap-1.5">
                      <FileText size={13} className="text-amber-600" /> Additional Notes for NGO / Partner
                    </span>
                    <p className="text-amber-900 text-xs mt-1 font-medium bg-white/70 p-2 rounded border border-amber-100">
                      "{selectedReq.additional_notes}"
                    </p>
                  </div>
                )}
                <div className="col-span-2 border-t pt-3"><span className="block text-gray-500 text-xs">Pickup Address</span><span className="text-gray-900 text-xs font-medium">{selectedReq.address}, {selectedReq.city} - {selectedReq.pincode}</span></div>
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

export default MyRequestsPage;
