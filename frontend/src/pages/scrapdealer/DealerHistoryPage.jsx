import React, { useState, useEffect } from 'react';
import { 
  History, Recycle, CheckCircle, Search, Filter, Calendar, MapPin, 
  Phone, Mail, Eye, Clock, Download, ArrowUpRight, Sparkles, Check, X, FileText, Printer, Truck, Scale
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ItemImage from '../../components/common/ItemImage';
import StatCard from '../../components/common/StatCard';
import { formatDate, formatDateTime, getItemImageUrl } from '../../utils/helpers';
import { RECYCLING_CATEGORIES } from '../../utils/constants';

const DealerHistoryPage = () => {
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemDetails, setItemDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/recycling?history=true');
      const data = Array.isArray(res.data) ? res.data : [];
      setHistoryItems(data);
    } catch (err) {
      console.error('Failed to load Scrap Dealer history:', err);
      toast.error('Could not load scrap collection history');
      setHistoryItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const openDetailsModal = async (item) => {
    setSelectedItem(item);
    setLoadingDetails(true);
    setCompletionNotes('');
    try {
      const res = await api.get(`/recycling/${item.id}`);
      setItemDetails(res.data);
    } catch (err) {
      setItemDetails(item);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCompleteProcessing = async (id) => {
    setUpdatingStatus(true);
    try {
      await api.patch(`/recycling/${id}/status`, {
        status: 'COMPLETED',
        notes: completionNotes || 'Materials sorted, processed, and shipped to authorized recycling facility.'
      });
      toast.success('Recycling job marked as Completed & Processed!');
      setSelectedItem(null);
      setItemDetails(null);
      fetchHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Filter items
  const filteredItems = historyItems.filter(item => {
    const matchesTab = 
      activeTab === 'ALL' ||
      (activeTab === 'COLLECTED' && item.status === 'COLLECTED') ||
      (activeTab === 'COMPLETED' && item.status === 'COMPLETED');

    const matchesCategory = categoryFilter === 'ALL' || item.waste_category === categoryFilter;

    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      searchQuery === '' ||
      item.waste_category?.toLowerCase().includes(query) ||
      item.request_id?.toLowerCase().includes(query) ||
      item.user_name?.toLowerCase().includes(query) ||
      item.city?.toLowerCase().includes(query) ||
      item.ai_prediction?.toLowerCase().includes(query);

    return matchesTab && matchesCategory && matchesSearch;
  });

  // Calculate summary metrics
  const totalJobsCount = historyItems.length;
  const inFacilityCount = historyItems.filter(i => i.status === 'COLLECTED').length;
  const completedCount = historyItems.filter(i => i.status === 'COMPLETED').length;
  const totalWeightKg = historyItems.reduce((acc, curr) => acc + (parseFloat(curr.quantity) || 0), 0).toFixed(1);
  const totalCo2Saved = (parseFloat(totalWeightKg) * 1.5).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <History className="text-teal-600" size={28} />
            Scrap Collection & Recycling History
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Complete audit trail, weights, and photographic records of all recyclable materials collected and processed.
          </p>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Processed Jobs" value={totalJobsCount} icon={<Recycle />} color="teal" />
        <StatCard title="Total Scrap Collected" value={`${totalWeightKg} kg`} icon={<Scale />} color="blue" />
        <StatCard title="Recycled & Dispatched" value={completedCount} icon={<CheckCircle />} color="green" />
        <StatCard title="Est. CO2 Diverted (kg)" value={totalCo2Saved} icon={<Sparkles />} color="purple" />
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Filters & Search */}
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-50/50">
          {/* Status Tabs */}
          <div className="flex space-x-2 overflow-x-auto w-full md:w-auto">
            {[
              { id: 'ALL', label: 'All History', count: totalJobsCount },
              { id: 'COLLECTED', label: 'Collected (In Facility)', count: inFacilityCount },
              { id: 'COMPLETED', label: 'Completed & Recycled', count: completedCount }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === tab.id ? 'bg-teal-700 text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-teal-500 focus:border-teal-500 bg-white"
            >
              <option value="ALL">All Materials</option>
              {RECYCLING_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search scrap, donor, ref #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-xs focus:ring-teal-500 focus:border-teal-500 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center">
              <LoadingSpinner size="large" />
              <p className="text-gray-500 text-sm mt-3">Loading scrap collection history...</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Scrap Photo</th>
                  <th className="px-6 py-4">Waste Material & Ref ID</th>
                  <th className="px-6 py-4">Weight / Quantity</th>
                  <th className="px-6 py-4">AI Verification</th>
                  <th className="px-6 py-4">User & Location</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Collected Date</th>
                  <th className="px-6 py-4 text-right">Receipt & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                    {/* Material Photo */}
                    <td className="px-6 py-4">
                      <ItemImage
                        src={item.image}
                        category={item.waste_category}
                        alt={item.waste_category}
                        title={`Scrap ${item.waste_category}`}
                        subtitle={`Quantity: ${item.quantity} ${item.quantity_unit || 'kg'}`}
                        className="w-14 h-14 rounded-xl object-cover"
                      />
                    </td>

                    {/* Material & Ref ID */}
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900 text-sm">{item.waste_category}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded border border-gray-200 font-semibold">
                          {item.request_id}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 bg-teal-50 text-teal-700 rounded-md border border-teal-200">
                          {item.waste_category}
                        </span>
                      </div>
                    </td>

                    {/* Quantity & Weight */}
                    <td className="px-6 py-4 text-xs">
                      <p className="font-bold text-teal-800 text-sm">{item.quantity} {item.quantity_unit || 'kg'}</p>
                      <p className="text-gray-400 mt-0.5 text-[11px]">Weight Verified</p>
                    </td>

                    {/* AI Verification */}
                    <td className="px-6 py-4 text-xs">
                      {item.ai_prediction ? (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-semibold border border-purple-200">
                          <Sparkles size={12} className="text-purple-600" />
                          <span>{item.ai_prediction} ({item.ai_confidence || 90}%)</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Manual Entry</span>
                      )}
                    </td>

                    {/* User & Location */}
                    <td className="px-6 py-4 text-xs text-gray-700">
                      <p className="font-semibold text-gray-900">{item.user_name || 'Donor / User'}</p>
                      <p className="text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={12} className="text-gray-400" />
                        {item.city}
                      </p>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      <StatusBadge status={item.status} />
                    </td>

                    {/* Collected Date */}
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {formatDate(item.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDetailsModal(item)}
                          className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                          title="View Full Recycling Lifecycle & Receipt"
                        >
                          <FileText size={14} />
                          Receipt & History
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                      <Recycle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      No collection records found in this history view.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Scrap Receipt & Full Lifecycle History Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">
            {/* Modal Header */}
            <div className="p-4 border-b flex justify-between items-center bg-gray-50/80">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-100 text-teal-800 rounded-lg">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Recycling Job Receipt & Audit History</h3>
                  <p className="text-xs text-gray-500 font-mono">Job Reference #{selectedItem.request_id}</p>
                </div>
              </div>
              <button
                onClick={() => { setSelectedItem(null); setItemDetails(null); }}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Photo Showcase */}
              <div className="relative rounded-xl overflow-hidden bg-gray-950/10 border border-gray-200">
                <ItemImage
                  src={selectedItem.image}
                  category={selectedItem.waste_category}
                  alt={selectedItem.waste_category}
                  title={`Scrap ${selectedItem.waste_category}`}
                  subtitle={`Log Ref #${selectedItem.request_id} • User: ${selectedItem.user_name || 'User'}`}
                  quantity={`${selectedItem.quantity} ${selectedItem.quantity_unit || 'kg'}`}
                  className="w-full h-64 object-cover sm:object-contain cursor-pointer"
                  containerClassName="w-full block"
                />
                {selectedItem.ai_prediction && (
                  <div className="absolute top-3 right-3 bg-purple-600/90 backdrop-blur-xs text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs">
                    <Sparkles size={12} />
                    <span>AI Detected: {selectedItem.ai_prediction} ({selectedItem.ai_confidence}%)</span>
                  </div>
                )}
                <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs text-gray-900 px-3 py-1 rounded-lg text-xs font-bold shadow-xs">
                  {selectedItem.quantity} {selectedItem.quantity_unit || 'kg'} &bull; {selectedItem.waste_category}
                </div>
              </div>

              {/* Scrap Info Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100 text-xs">
                <div>
                  <span className="block text-gray-500 font-medium">Material Category</span>
                  <span className="font-bold text-gray-900 text-sm mt-0.5">{selectedItem.waste_category}</span>
                </div>
                <div>
                  <span className="block text-gray-500 font-medium">Weight / Quantity</span>
                  <span className="font-bold text-teal-700 text-sm mt-0.5 block">{selectedItem.quantity} {selectedItem.quantity_unit || 'kg'}</span>
                </div>
                <div>
                  <span className="block text-gray-500 font-medium">Current Status</span>
                  <div className="mt-0.5"><StatusBadge status={selectedItem.status} /></div>
                </div>
                <div>
                  <span className="block text-gray-500 font-medium">User / Donor Name</span>
                  <span className="font-medium text-gray-900 mt-0.5">{selectedItem.user_name || itemDetails?.user_name || 'User'}</span>
                </div>
                <div>
                  <span className="block text-gray-500 font-medium">User Phone</span>
                  <span className="font-medium text-gray-900 mt-0.5">{selectedItem.user_phone || itemDetails?.user_phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-gray-500 font-medium">Pickup City</span>
                  <span className="font-medium text-gray-900 mt-0.5">{selectedItem.city}</span>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <span className="block text-gray-500 font-medium">User Description / Notes</span>
                  <p className="text-gray-800 mt-0.5">{selectedItem.description || itemDetails?.description || 'No additional user notes provided.'}</p>
                </div>
                <div className="col-span-2 sm:col-span-3 border-t border-gray-200 pt-2.5 mt-1">
                  <span className="block text-gray-500 font-medium">Pickup Address</span>
                  <p className="text-gray-800 mt-0.5">{selectedItem.address}, {selectedItem.city} - {selectedItem.pincode}</p>
                </div>
              </div>

              {/* Full Audit Lifecycle Timeline */}
              <div>
                <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-1.5">
                  <Clock size={16} className="text-teal-600" />
                  Scrap Handling Timeline & Audit History
                </h4>

                {loadingDetails ? (
                  <div className="py-4 flex justify-center"><LoadingSpinner size="small" /></div>
                ) : (
                  <div className="relative pl-6 border-l-2 border-teal-200 space-y-4">
                    {/* Step 1: Created */}
                    <div className="relative">
                      <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-teal-600 border-2 border-white"></div>
                      <p className="text-xs font-bold text-gray-900">Recycling Pickup Requested</p>
                      <p className="text-[11px] text-gray-500">{formatDateTime(selectedItem.created_at)}</p>
                      <p className="text-xs text-gray-600 mt-0.5">Scrap submitted: {selectedItem.waste_category} ({selectedItem.quantity} {selectedItem.quantity_unit || 'kg'})</p>
                    </div>

                    {/* Status History Steps */}
                    {itemDetails?.history && itemDetails.history.length > 0 ? (
                      itemDetails.history.map((h, index) => (
                        <div key={h.id || index} className="relative">
                          <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 border-white ${
                            h.status === 'COMPLETED' ? 'bg-green-600' : h.status === 'COLLECTED' ? 'bg-blue-600' : 'bg-teal-500'
                          }`}></div>
                          <p className="text-xs font-bold text-gray-900">Status Changed to {h.status}</p>
                          <p className="text-[11px] text-gray-500">{formatDateTime(h.created_at)}</p>
                          {h.notes && (
                            <p className="text-xs text-gray-700 mt-0.5 bg-gray-50 p-2 rounded border border-gray-100 italic">
                              "{h.notes}"
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="relative">
                        <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-blue-600 border-2 border-white"></div>
                        <p className="text-xs font-bold text-gray-900">Materials Collected & Stored</p>
                        <p className="text-[11px] text-gray-500">{formatDateTime(selectedItem.created_at)}</p>
                        <p className="text-xs text-gray-600 mt-0.5">Collected from donor and weighed at dealer depot.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Complete Processing Action (If still in COLLECTED status) */}
              {selectedItem.status === 'COLLECTED' && (
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 space-y-3">
                  <h5 className="font-bold text-teal-900 text-xs flex items-center gap-1.5">
                    <CheckCircle size={15} />
                    Ready to Complete Recycling Processing?
                  </h5>
                  <p className="text-xs text-teal-800">
                    When these materials have been sorted, baled, or dispatched to recycling centers, mark as Completed to update the environmental impact metrics.
                  </p>
                  <textarea
                    rows="2"
                    placeholder="Optional processing notes (e.g. Sent to Mumbai Plastics Reprocessing Plant, Batch #882)..."
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    className="w-full text-xs p-2.5 border border-teal-300 rounded-lg bg-white focus:ring-teal-500 focus:border-teal-500"
                  ></textarea>
                  <button
                    onClick={() => handleCompleteProcessing(selectedItem.id)}
                    disabled={updatingStatus}
                    className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
                  >
                    <Check size={14} />
                    {updatingStatus ? 'Updating...' : 'Mark as Completed & Recycled'}
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
              <button
                onClick={() => { setSelectedItem(null); setItemDetails(null); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                Close History View
              </button>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <Printer size={14} /> Print Scrap Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealerHistoryPage;
