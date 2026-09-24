import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Recycle, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { formatDate } from '../../utils/helpers';
import api from '../../services/api';

const UserDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalDonations: 0, totalRecycled: 0, activeRequests: 0, completedRequests: 0 });
  const [recentRequests, setRecentRequests] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dashRes, donationsRes, recyclingRes] = await Promise.all([
          api.get('/users/dashboard'),
          api.get('/donations'),
          api.get('/recycling'),
        ]);

        // Calculate stats from dashboard response
        const dashData = dashRes.data;
        const donations = Array.isArray(donationsRes.data) ? donationsRes.data : [];
        const recycling = Array.isArray(recyclingRes.data) ? recyclingRes.data : [];

        const totalDonations = donations.length;
        const totalRecycled = Math.round(recycling.reduce((sum, r) => sum + (parseFloat(r.quantity) || 0), 0) * 10) / 10;
        const activeRequests = [...donations, ...recycling].filter(r => r.status === 'PENDING' || r.status === 'ACCEPTED' || r.status === 'PICKUP_SCHEDULED').length;
        const completedRequests = [...donations, ...recycling].filter(r => r.status === 'COMPLETED' || r.status === 'RECEIVED' || r.status === 'COLLECTED').length;

        setStats({ totalDonations, totalRecycled, activeRequests, completedRequests });

        // Merge and sort recent requests
        const allRequests = [
          ...donations.slice(0, 5).map(d => ({
            id: d.request_id,
            type: 'Donation',
            item: d.item_name,
            receiver: d.ngo_name || (d.ngo_id ? `NGO #${d.ngo_id}` : '-'),
            status: d.status,
            date: d.created_at,
          })),
          ...recycling.slice(0, 5).map(r => ({
            id: r.request_id,
            type: 'Recycling',
            item: `${r.waste_category} (${r.quantity || '?'} ${r.quantity_unit || 'kg'})`,
            receiver: r.dealer_name || (r.scrap_dealer_id ? `Dealer #${r.scrap_dealer_id}` : '-'),
            status: r.status,
            date: r.created_at,
          })),
        ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

        setRecentRequests(allRequests);
      } catch (error) {
        // Fallback demo data
        setStats({ totalDonations: 0, totalRecycled: 0, activeRequests: 0, completedRequests: 0 });
        setRecentRequests([]);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
        <p className="text-gray-500">Here's what's happening with your eco-contributions today.</p>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link to="/donate" className="bg-green-600 rounded-2xl p-6 text-white hover:bg-green-700 transition-colors flex items-center justify-between group shadow-sm">
          <div>
            <h3 className="text-xl font-bold mb-1">Donate an Item</h3>
            <p className="text-green-100 text-sm">Give your usable items a second life</p>
          </div>
          <div className="bg-green-500 p-4 rounded-full group-hover:scale-110 transition-transform">
            <Heart size={28} />
          </div>
        </Link>
        <Link to="/recycle" className="bg-teal-600 rounded-2xl p-6 text-white hover:bg-teal-700 transition-colors flex items-center justify-between group shadow-sm">
          <div>
            <h3 className="text-xl font-bold mb-1">Recycle Waste</h3>
            <p className="text-teal-100 text-sm">Properly dispose of your recyclables</p>
          </div>
          <div className="bg-teal-500 p-4 rounded-full group-hover:scale-110 transition-transform">
            <Recycle size={28} />
          </div>
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Donations" value={stats.totalDonations} icon={<Heart />} color="green" />
        <StatCard title="Total Recycled (kg)" value={stats.totalRecycled} icon={<Recycle />} color="teal" />
        <StatCard title="Active Requests" value={stats.activeRequests} icon={<Clock />} color="yellow" />
        <StatCard title="Completed" value={stats.completedRequests} icon={<CheckCircle />} color="blue" />
      </div>

      {/* Recent Requests Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-semibold text-gray-800">Recent Requests</h3>
          <Link to="/my-requests" className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center">
            View All <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">Request ID</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Item</th>
                <th className="px-6 py-3 font-medium">Receiver</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentRequests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-medium text-gray-900">{req.id}</td>
                  <td className="px-6 py-4">
                     <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${req.type === 'Donation' ? 'bg-green-50 text-green-700' : 'bg-teal-50 text-teal-700'}`}>
                        {req.type}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{req.item}</td>
                  <td className="px-6 py-4 text-gray-500">{req.receiver || '-'}</td>
                  <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
                  <td className="px-6 py-4 text-gray-500">{formatDate(req.date)}</td>
                </tr>
              ))}
              {recentRequests.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No recent requests found. Start by donating or recycling!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
