import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Clock, CheckCircle, Package, ArrowRight, AlertCircle, Eye, FileText } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ItemImage from '../../components/common/ItemImage';
import { formatDate } from '../../utils/helpers';
import api from '../../services/api';
import toast from 'react-hot-toast';

const NGODashboard = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const verificationStatus = user?.ngo_details?.verification_status || user?.status || 'pending';

  const fetchDonations = async () => {
    try {
      const res = await api.get('/donations');
      setDonations(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setDonations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  const handleStatusUpdate = async (donationId, newStatus) => {
    try {
      setUpdating(donationId);
      await api.patch(`/donations/${donationId}/status`, { status: newStatus });
      toast.success(`Donation ${newStatus.toLowerCase()} successfully!`);
      fetchDonations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setUpdating(null);
    }
  };

  const pending = donations.filter(d => d.status === 'PENDING').length;
  const inProgress = donations.filter(d => d.status === 'ACCEPTED' || d.status === 'PICKUP_SCHEDULED').length;
  const receivedAndCompleted = donations.filter(d => d.status === 'RECEIVED' || d.status === 'COMPLETED').length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">NGO Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.name}. Manage donation items, view donor photos, and inspect received history.</p>
      </div>

      {verificationStatus === 'pending' && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
            <p className="text-sm text-yellow-700 font-medium">
              Your account is pending verification. You can view requests but cannot accept them until an admin verifies your account.
            </p>
          </div>
        </div>
      )}

      {verificationStatus === 'approved' && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
          <p className="text-sm text-green-800 font-medium">✓ Your NGO is verified and active to receive donations.</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Available" value={donations.length} icon={<Package />} color="blue" />
        <StatCard title="Pending Review" value={pending} icon={<Clock />} color="yellow" />
        <StatCard title="In Progress" value={inProgress} icon={<Heart />} color="green" />
        <Link to="/ngo/history" className="block transform hover:scale-[1.02] transition-transform">
          <StatCard title="Received History" value={receivedAndCompleted} icon={<CheckCircle />} color="purple" />
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-gray-900 text-base">Recent Donation Offers</h3>
            <p className="text-xs text-gray-500">Inspect donor items, accept pickups, and track status</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/ngo/history" className="text-xs text-purple-700 hover:text-purple-800 font-bold bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg border border-purple-200 transition-colors">
              View Received History →
            </Link>
            <Link to="/ngo/requests" className="text-sm text-green-600 hover:text-green-700 flex items-center font-semibold">
              All Requests <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : donations.length === 0 ? (
          <EmptyState message="No donation requests yet. They will appear here when users donate in your area." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3">Photo</th>
                  <th className="px-6 py-3">Item Details</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">City</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                  {verificationStatus === 'approved' && <th className="px-6 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {donations.slice(0, 8).map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3">
                      <ItemImage
                        src={d.image}
                        category={d.category}
                        alt={d.item_name}
                        title={d.item_name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    </td>
                    <td className="px-6 py-3 font-semibold text-gray-900">
                      <p>{d.item_name}</p>
                      {d.additional_notes && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-0.5" title={d.additional_notes}>
                          <FileText size={10} className="text-amber-600" /> Note for NGO
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-semibold rounded-md border border-green-200">
                        {d.category}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-500">{d.city}</td>
                    <td className="px-6 py-3"><StatusBadge status={d.status} /></td>
                    <td className="px-6 py-3 text-gray-500 text-xs">{formatDate(d.created_at)}</td>
                    {verificationStatus === 'approved' && (
                      <td className="px-6 py-3 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <Link
                            to="/ngo/requests"
                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-lg font-medium"
                          >
                            Details
                          </Link>
                          {d.status === 'PENDING' && (
                            <button
                              onClick={() => handleStatusUpdate(d.id, 'ACCEPTED')}
                              disabled={updating === d.id}
                              className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold shadow-xs"
                            >
                              {updating === d.id ? '...' : 'Accept'}
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default NGODashboard;
