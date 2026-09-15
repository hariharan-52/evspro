import React, { useState, useEffect } from 'react';
import { Eye, Check, X, ShieldAlert, Search, RefreshCw, Truck, MapPin, Mail, Phone, Tag, Calendar } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/helpers';

const AdminDealersPage = () => {
  const [activeTab, setActiveTab] = useState('All');
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [detailsModalDealer, setDetailsModalDealer] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchDealers();
  }, []);

  const fetchDealers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/scrap-dealers');
      const data = Array.isArray(res.data) ? res.data : (res.data?.dealers || []);
      const normalized = data.map(item => {
        let mats = [];
        try {
          if (Array.isArray(item.accepted_materials || item.acceptedMaterials)) {
            mats = item.accepted_materials || item.acceptedMaterials;
          } else if (typeof (item.accepted_materials || item.acceptedMaterials) === 'string') {
            mats = JSON.parse(item.accepted_materials || item.acceptedMaterials);
          }
        } catch (e) {
          mats = [];
        }

        return {
          id: item.id,
          userId: item.user_id || item.userId,
          businessName: item.business_name || item.businessName || item.name || 'Unnamed Business',
          contactPerson: item.contact_person || item.contactPerson || item.name || 'Not provided',
          regNumber: item.registration_number || item.regNumber || 'N/A',
          email: item.email || 'N/A',
          phone: item.phone || 'N/A',
          city: item.city || 'N/A',
          address: item.address || 'N/A',
          state: item.state || '',
          pincode: item.pincode || '',
          acceptedMaterials: mats,
          verificationStatus: (item.verification_status || item.verificationStatus || 'pending').toLowerCase(),
          rejectionReason: item.rejection_reason || item.rejectionReason || null,
          createdAt: item.created_at || item.createdAt || new Date().toISOString()
        };
      });
      setDealers(normalized);
    } catch (err) {
      console.error('Failed to fetch Scrap Dealers:', err);
      toast.error('Could not load Scrap Dealers from server');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setProcessingId(id);
    try {
      await api.patch(`/scrap-dealers/${id}/verify`, { status: 'approved' });
      toast.success('Scrap Dealer verified and approved! They can now log in.');
      await fetchDealers();
    } catch (err) {
      console.error('Error approving dealer:', err);
      toast.error(err.response?.data?.message || 'Failed to approve Scrap Dealer');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please specify a rejection reason');
      return;
    }
    setProcessingId(selectedDealer.id);
    try {
      await api.patch(`/scrap-dealers/${selectedDealer.id}/verify`, { status: 'rejected', reason: rejectReason.trim() });
      toast.success('Scrap Dealer application rejected.');
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedDealer(null);
      await fetchDealers();
    } catch (err) {
      console.error('Error rejecting dealer:', err);
      toast.error(err.response?.data?.message || 'Failed to reject Scrap Dealer');
    } finally {
      setProcessingId(null);
    }
  };

  const counts = {
    All: dealers.length,
    Pending: dealers.filter(d => d.verificationStatus === 'pending').length,
    Approved: dealers.filter(d => d.verificationStatus === 'approved').length,
    Rejected: dealers.filter(d => d.verificationStatus === 'rejected').length
  };

  const filteredDealers = dealers.filter(dealer => {
    const matchesTab = activeTab === 'All' || dealer.verificationStatus === activeTab.toLowerCase();
    const matchesSearch = searchQuery === '' || 
      dealer.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dealer.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dealer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dealer.regNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dealer.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dealer.acceptedMaterials.some(m => m.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="text-green-600" size={28} />
            Scrap Dealer Verification & Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Review, verify, and approve recycling partners and scrap dealer businesses.
          </p>
        </div>
        <button
          onClick={fetchDealers}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tabs & Search */}
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-50/50">
          {/* Tabs */}
          <div className="flex space-x-2 overflow-x-auto w-full md:w-auto">
            {['All', 'Pending', 'Approved', 'Rejected'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span>{tab}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === tab ? 'bg-green-700 text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  {counts[tab] || 0}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by business, material, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center">
              <LoadingSpinner size="large" />
              <p className="text-gray-500 text-sm mt-3">Loading Scrap Dealer records...</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Business Details</th>
                  <th className="px-6 py-4">Registration / GST #</th>
                  <th className="px-6 py-4">Accepted Materials</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Registered Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDealers.map(dealer => (
                  <tr key={dealer.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                        <Truck size={16} className="text-green-600 flex-shrink-0" />
                        <span>{dealer.businessName}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">Rep: {dealer.contactPerson}</p>
                      <p className="text-xs text-gray-400">{dealer.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded border border-gray-200 font-semibold">
                        {dealer.regNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {dealer.acceptedMaterials?.map(mat => (
                          <span key={mat} className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded text-[11px] font-semibold">
                            {mat}
                          </span>
                        ))}
                        {(!dealer.acceptedMaterials || dealer.acceptedMaterials.length === 0) && (
                          <span className="text-xs text-gray-400">All materials</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      <span className="text-xs font-medium">{dealer.city}</span>
                      {dealer.state && <span className="text-xs text-gray-500">, {dealer.state}</span>}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {formatDate(dealer.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                        dealer.verificationStatus === 'approved' 
                          ? 'bg-green-100 text-green-800' 
                          : dealer.verificationStatus === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800 animate-pulse'
                      }`}>
                        {dealer.verificationStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* View Details */}
                        <button
                          onClick={() => setDetailsModalDealer(dealer)}
                          className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>

                        {/* If Pending, Show Approve and Reject buttons */}
                        {dealer.verificationStatus === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(dealer.id)}
                              disabled={processingId === dealer.id}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors disabled:opacity-50"
                              title="Approve Scrap Dealer"
                            >
                              <Check size={14} />
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedDealer(dealer);
                                setShowRejectModal(true);
                              }}
                              disabled={processingId === dealer.id}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                              title="Reject Scrap Dealer"
                            >
                              <X size={14} />
                              Reject
                            </button>
                          </>
                        )}

                        {/* If already Approved or Rejected, allow changing if necessary */}
                        {dealer.verificationStatus !== 'pending' && (
                          <div className="flex items-center gap-1">
                            {dealer.verificationStatus === 'rejected' ? (
                              <button
                                onClick={() => handleApprove(dealer.id)}
                                className="text-xs text-green-700 hover:text-green-800 font-medium px-2 py-1 bg-green-50 rounded hover:bg-green-100"
                              >
                                Re-approve
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedDealer(dealer);
                                  setShowRejectModal(true);
                                }}
                                className="text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1 bg-red-50 rounded hover:bg-red-100"
                              >
                                Revoke
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredDealers.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      <ShieldAlert className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      No Scrap Dealers found in the "{activeTab}" category.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* View Dealer Details Modal */}
      {detailsModalDealer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 text-green-700 rounded-xl">
                  <Truck size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{detailsModalDealer.businessName}</h3>
                  <p className="text-xs text-gray-500">Registered: {formatDate(detailsModalDealer.createdAt)}</p>
                </div>
              </div>
              <button onClick={() => setDetailsModalDealer(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="py-4 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Status</p>
                  <p className="font-semibold capitalize text-gray-900 mt-0.5">{detailsModalDealer.verificationStatus}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Registration / GST #</p>
                  <p className="font-mono font-bold text-gray-900 mt-0.5">{detailsModalDealer.regNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Authorized Contact Person</p>
                  <p className="font-medium text-gray-900 mt-0.5">{detailsModalDealer.contactPerson}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Phone</p>
                  <p className="font-medium text-gray-900 mt-0.5">{detailsModalDealer.phone}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 font-medium">Email</p>
                  <p className="font-medium text-gray-900 mt-0.5">{detailsModalDealer.email}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 font-medium">Yard / Facility Address</p>
                  <p className="text-gray-700 mt-0.5">{detailsModalDealer.address}, {detailsModalDealer.city} {detailsModalDealer.pincode}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 font-medium mb-1.5">Authorized / Accepted Waste Materials</p>
                <div className="flex flex-wrap gap-1.5 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  {detailsModalDealer.acceptedMaterials?.map(mat => (
                    <span key={mat} className="px-2.5 py-1 bg-green-100 text-green-800 rounded-md text-xs font-semibold">
                      {mat}
                    </span>
                  ))}
                  {(!detailsModalDealer.acceptedMaterials || detailsModalDealer.acceptedMaterials.length === 0) && (
                    <span className="text-xs text-gray-500">All materials accepted</span>
                  )}
                </div>
              </div>

              {detailsModalDealer.rejectionReason && (
                <div className="p-3 bg-red-50 text-red-800 rounded-lg border border-red-100 text-xs">
                  <span className="font-bold">Rejection Reason: </span>
                  {detailsModalDealer.rejectionReason}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <button
                onClick={() => setDetailsModalDealer(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>

              {detailsModalDealer.verificationStatus === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const dealer = detailsModalDealer;
                      setDetailsModalDealer(null);
                      setSelectedDealer(dealer);
                      setShowRejectModal(true);
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      const id = detailsModalDealer.id;
                      setDetailsModalDealer(null);
                      handleApprove(id);
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                  >
                    Approve Dealer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedDealer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Reject Scrap Dealer Application</h3>
            <p className="text-sm text-gray-500 mb-4">
              Please specify the reason for rejecting <span className="font-semibold text-gray-900">{selectedDealer.businessName}</span>.
            </p>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 text-sm mb-4 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              rows="3"
              placeholder="e.g. Unverified business license, incomplete contact verification..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            ></textarea>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700"
                onClick={handleRejectConfirm}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDealersPage;
