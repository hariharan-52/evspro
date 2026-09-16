import React, { useState, useEffect } from 'react';
import { 
  History, Package, CheckCircle, Search, Filter, Calendar, MapPin, 
  Phone, Mail, Eye, Clock, Download, ArrowUpRight, Sparkles, Check, X, FileText, Printer
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ItemImage from '../../components/common/ItemImage';
import StatCard from '../../components/common/StatCard';
import { formatDate, formatDateTime, getItemImageUrl } from '../../utils/helpers';
import { DONATION_CATEGORIES } from '../../utils/constants';

const NGOHistoryPage = () => {
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
      // Query donations with history=true or filter for received/completed
      const res = await api.get('/donations?history=true');
      const data = Array.isArray(res.data) ? res.data : [];
      setHistoryItems(data);
    } catch (err) {
      console.error('Failed to load NGO received history:', err);
      toast.error('Could not load received item history');
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
      const res = await api.get(`/donations/${item.id}`);
      setItemDetails(res.data);
    } catch (err) {
      setItemDetails(item);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCompleteDistribution = async (id) => {
    setUpdatingStatus(true);
    try {
      await api.patch(`/donations/${id}/status`, {
        status: 'COMPLETED',
        notes: completionNotes || 'Item successfully distributed to community beneficiaries.'
      });
      toast.success('Donation marked as Completed & Distributed!');
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
      (activeTab === 'RECEIVED' && item.status === 'RECEIVED') ||
      (activeTab === 'COMPLETED' && item.status === 'COMPLETED');

    const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;

    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      searchQuery === '' ||
      item.item_name?.toLowerCase().includes(query) ||
      item.request_id?.toLowerCase().includes(query) ||
      item.donor_name?.toLowerCase().includes(query) ||
      item.city?.toLowerCase().includes(query) ||
      item.category?.toLowerCase().includes(query);

    return matchesTab && matchesCategory && matchesSearch;
  });

  // Calculate summary metrics
  const totalReceivedCount = historyItems.length;
  const inWarehouseCount = historyItems.filter(i => i.status === 'RECEIVED').length;
  const completedCount = historyItems.filter(i => i.status === 'COMPLETED').length;
  const totalItemsQuantity = historyItems.reduce((acc, curr) => acc + (parseInt(curr.quantity, 10) || 1), 0);
  const totalCo2Saved = (totalItemsQuantity * 2.5).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <History className="text-green-600" size={28} />
            Received Items History
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Complete audit trail and photographic record of all donation items received and processed by your organization.
          </p>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Received Items" value={totalReceivedCount} icon={<Package />} color="blue" />
        <StatCard title="In Storage / Verified" value={inWarehouseCount} icon={<Clock />} color="yellow" />
        <StatCard title="Distributed / Completed" value={completedCount} icon={<CheckCircle />} color="green" />
        <StatCard title="Est. CO2 Saved (kg)" value={totalCo2Saved} icon={<Sparkles />} color="purple" />
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Filters & Search */}
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-50/50">
          {/* Status Tabs */}
          <div className="flex space-x-2 overflow-x-auto w-full md:w-auto">
            {[
              { id: 'ALL', label: 'All History', count: totalReceivedCount },
              { id: 'RECEIVED', label: 'Received (In Storage)', count: inWarehouseCount },
              { id: 'COMPLETED', label: 'Completed & Distributed', count: completedCount }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-green-600 text-white shadow-xs'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === tab.id ? 'bg-green-700 text-white' : 'bg-gray-200 text-gray-700'
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
              className="border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-green-500 focus:border-green-500 bg-white"
            >
              <option value="ALL">All Categories</option>
              {DONATION_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search item, donor, ref #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-xs focus:ring-green-500 focus:border-green-500 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center">
              <LoadingSpinner size="large" />
              <p className="text-gray-500 text-sm mt-3">Loading received donation history...</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Item Photo</th>
                  <th className="px-6 py-4">Item & Category</th>
                  <th className="px-6 py-4">Quantity & Condition</th>
                  <th className="px-6 py-4">Donor & Location</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Received Date</th>
                  <th className="px-6 py-4 text-right">Receipt & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                    {/* Item Photo */}
                    <td className="px-6 py-4">
                      <ItemImage
                        src={item.image}
                        category={item.category}
                        alt={item.item_name}
                        title={item.item_name}
                        subtitle={`Category: ${item.category} • Condition: ${item.condition_state}`}
                        className="w-14 h-14 rounded-xl object-cover"
                      />
                    </td>

                    {/* Item & Ref ID */}
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900 text-sm">{item.item_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded border border-gray-200 font-semibold">
                          {item.request_id}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 bg-green-50 text-green-700 rounded-md border border-green-200">
                          {item.category}
                        </span>
                      </div>
                    </td>

                    {/* Quantity & Condition */}
                    <td className="px-6 py-4 text-xs">
                      <p className="font-bold text-gray-900">{item.quantity} unit(s)</p>
                      <p className="text-gray-500 mt-0.5">Condition: <span className="font-medium text-gray-700">{item.condition_state || 'Good'}</span></p>
                    </td>

                    {/* Donor Details */}
                    <td className="px-6 py-4 text-xs text-gray-700">
                      <p className="font-semibold text-gray-900">{item.donor_name || 'Donor'}</p>
                      <p className="text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={12} className="text-gray-400" />
                        {item.city}
                      </p>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      <StatusBadge status={item.status} />
                    </td>

                    {/* Received Date */}
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {formatDate(item.created_at)}
                    </td>

                    {/* Action */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDetailsModal(item)}
                          className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                          title="View Full Lifecycle History & Receipt"
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
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      <Package className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      No received items found in this history view.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Item Receipt & Full Lifecycle History Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">
            {/* Modal Header */}
            <div className="p-4 border-b flex justify-between items-center bg-gray-50/80">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 text-green-800 rounded-lg">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Donation Receipt & Audit History</h3>
                  <p className="text-xs text-gray-500 font-mono">Reference #{selectedItem.request_id}</p>
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
                  category={selectedItem.category}
                  alt={selectedItem.item_name}
                  title={selectedItem.item_name}
                  subtitle={`Receipt Ref #${selectedItem.request_id} • Donor: ${selectedItem.donor_name || 'Donor'}`}
                  condition={selectedItem.condition_state}
                  quantity={selectedItem.quantity}
                  className="w-full h-64 object-cover sm:object-contain cursor-pointer"
                  containerClassName="w-full block"
                />
                <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs text-gray-900 px-3 py-1 rounded-lg text-xs font-bold shadow-xs pointer-events-none">
                  {selectedItem.quantity} unit(s) &bull; {selectedItem.condition_state || 'Good'}
                </div>
              </div>

              {/* Item Info Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100 text-xs">
                <div>
                  <span className="block text-gray-500 font-medium">Item Name</span>
                  <span className="font-bold text-gray-900 text-sm mt-0.5">{selectedItem.item_name}</span>
                </div>
                <div>
                  <span className="block text-gray-500 font-medium">Category</span>
                  <span className="font-semibold text-green-700 mt-0.5 block">{selectedItem.category}</span>
                </div>
                <div>
                  <span className="block text-gray-500 font-medium">Current Status</span>
                  <div className="mt-0.5"><StatusBadge status={selectedItem.status} /></div>
                </div>
                <div>
                  <span className="block text-gray-500 font-medium">Donor Name</span>
                  <span className="font-medium text-gray-900 mt-0.5">{selectedItem.donor_name || itemDetails?.donor_name || 'Donor'}</span>
                </div>
                <div>
                  <span className="block text-gray-500 font-medium">Donor Phone</span>
                  <span className="font-medium text-gray-900 mt-0.5">{selectedItem.donor_phone || itemDetails?.donor_phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-gray-500 font-medium">Pickup City</span>
                  <span className="font-medium text-gray-900 mt-0.5">{selectedItem.city}</span>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <span className="block text-gray-500 font-medium">Item Description</span>
                  <p className="text-gray-800 mt-0.5">{selectedItem.description || itemDetails?.description || 'No description provided.'}</p>
                </div>
                {(selectedItem.additional_notes || itemDetails?.additional_notes) && (
                  <div className="col-span-2 sm:col-span-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <span className="text-amber-800 text-xs font-bold flex items-center gap-1">
                      <FileText size={13} className="text-amber-600" /> Additional Notes for NGO
                    </span>
                    <p className="text-amber-900 mt-1 font-medium bg-white/70 p-2 rounded border border-amber-100">
                      "{selectedItem.additional_notes || itemDetails?.additional_notes}"
                    </p>
                  </div>
                )}
                <div className="col-span-2 sm:col-span-3 border-t border-gray-200 pt-2.5 mt-1">
                  <span className="block text-gray-500 font-medium">Full Pickup Address</span>
                  <p className="text-gray-800 mt-0.5">{selectedItem.address}, {selectedItem.city} - {selectedItem.pincode}</p>
                </div>
              </div>

              {/* Full Audit Lifecycle Timeline */}
              <div>
                <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-1.5">
                  <Clock size={16} className="text-green-600" />
                  Item Handling Timeline & Status History
                </h4>

                {loadingDetails ? (
                  <div className="py-4 flex justify-center"><LoadingSpinner size="small" /></div>
                ) : (
                  <div className="relative pl-6 border-l-2 border-green-200 space-y-4">
                    {/* Item Created Step */}
                    <div className="relative">
                      <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-green-600 border-2 border-white"></div>
                      <p className="text-xs font-bold text-gray-900">Donation Request Created by Donor</p>
                      <p className="text-[11px] text-gray-500">{formatDateTime(selectedItem.created_at)}</p>
                      <p className="text-xs text-gray-600 mt-0.5">Item offered on platform: {selectedItem.item_name} ({selectedItem.category})</p>
                    </div>

                    {/* Status History Steps */}
                    {itemDetails?.history && itemDetails.history.length > 0 ? (
                      itemDetails.history.map((h, index) => (
                        <div key={h.id || index} className="relative">
                          <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 border-white ${
                            h.status === 'COMPLETED' ? 'bg-purple-600' : h.status === 'RECEIVED' ? 'bg-blue-600' : 'bg-green-500'
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
                        <p className="text-xs font-bold text-gray-900">Item Received & Verified</p>
                        <p className="text-[11px] text-gray-500">{formatDateTime(selectedItem.created_at)}</p>
                        <p className="text-xs text-gray-600 mt-0.5">Received and stored at NGO facility.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Complete Distribution Action (If still in RECEIVED status) */}
              {selectedItem.status === 'RECEIVED' && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
                  <h5 className="font-bold text-green-900 text-xs flex items-center gap-1.5">
                    <CheckCircle size={15} />
                    Ready for Distribution to Beneficiaries?
                  </h5>
                  <p className="text-xs text-green-800">
                    When this item has been distributed to people in need or community centers, mark it as Completed to update the environmental impact metrics.
                  </p>
                  <textarea
                    rows="2"
                    placeholder="Optional distribution notes (e.g. Distributed at City Community Shelter)..."
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    className="w-full text-xs p-2.5 border border-green-300 rounded-lg bg-white focus:ring-green-500 focus:border-green-500"
                  ></textarea>
                  <button
                    onClick={() => handleCompleteDistribution(selectedItem.id)}
                    disabled={updatingStatus}
                    className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
                  >
                    <Check size={14} />
                    {updatingStatus ? 'Updating...' : 'Mark as Completed & Distributed'}
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
                <Printer size={14} /> Print NGO Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NGOHistoryPage;
