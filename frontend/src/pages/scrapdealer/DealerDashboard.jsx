import React, { useState, useEffect } from 'react';
import { Truck, Clock, CheckCircle, Recycle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ItemImage from '../../components/common/ItemImage';
import { formatDate } from '../../utils/helpers';
import api from '../../services/api';

const DealerDashboard = () => {
  const [stats, setStats] = useState({ requests: 0, pending: 0, accepted: 0, collected: 0, completed: 0, weight: 0 });
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/recycling');
      const reqs = Array.isArray(res.data) ? res.data : [];
      const totalWeight = reqs.reduce((sum, r) => sum + (parseFloat(r.quantity) || 0), 0);
      setStats({
        requests: reqs.length,
        pending: reqs.filter(r => r.status === 'PENDING').length,
        accepted: reqs.filter(r => r.status === 'ACCEPTED' || r.status === 'PICKUP_SCHEDULED').length,
        collected: reqs.filter(r => r.status === 'COLLECTED').length,
        completed: reqs.filter(r => r.status === 'COMPLETED').length,
        weight: Math.round(totalWeight * 10) / 10
      });
      setRecentRequests(reqs.slice(0, 6));
    } catch (error) {
      setStats({ requests: 0, pending: 0, accepted: 0, collected: 0, completed: 0, weight: 0 });
      setRecentRequests([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Scrap Dealer Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your recycling pickups, view user scrap item photos, and track collections.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        <StatCard title="Total Requests" value={stats.requests} icon={<Recycle />} color="blue" />
        <StatCard title="Pending Leads" value={stats.pending} icon={<Clock />} color="yellow" />
        <StatCard title="Active Pickups" value={stats.accepted} icon={<Truck />} color="green" />
        <Link to="/dealer/history" className="block transform hover:scale-[1.02] transition-transform">
          <StatCard title="Collection History" value={stats.collected + stats.completed} icon={<CheckCircle />} color="purple" />
        </Link>
        <StatCard title="Total Weight" value={`${stats.weight} kg`} icon={<Recycle />} color="teal" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="font-bold text-gray-900 text-base">Recent Scrap Item Leads</h3>
            <p className="text-xs text-gray-500">Inspect recyclable scrap photos, accept pickups, and track history</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/dealer/history" className="text-xs text-teal-700 hover:text-teal-800 font-bold bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg border border-teal-200 transition-colors">
              View Collection History →
            </Link>
            <Link to="/dealer/requests" className="text-sm text-teal-600 hover:text-teal-700 font-semibold flex items-center">
              All Scrap Leads <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
        </div>
        {loading ? (
          <div className="py-12 flex justify-center"><LoadingSpinner /></div>
        ) : recentRequests.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No recycling requests found in your area yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3">Photo</th>
                  <th className="px-6 py-3">Waste Material</th>
                  <th className="px-6 py-3">Quantity</th>
                  <th className="px-6 py-3">User & City</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3">
                      <ItemImage
                        src={req.image}
                        category={req.waste_category}
                        alt={req.waste_category}
                        title={`Scrap ${req.waste_category}`}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    </td>
                    <td className="px-6 py-3 font-semibold text-gray-900">{req.waste_category}</td>
                    <td className="px-6 py-3 text-gray-700 font-medium">{req.quantity} {req.quantity_unit || 'kg'}</td>
                    <td className="px-6 py-3 text-gray-700 text-xs">
                      <p className="font-medium text-gray-900">{req.user_name}</p>
                      <p className="text-gray-500">{req.city}</p>
                    </td>
                    <td className="px-6 py-3"><StatusBadge status={req.status} /></td>
                    <td className="px-6 py-3 text-gray-500 text-xs">{formatDate(req.created_at)}</td>
                    <td className="px-6 py-3 text-right">
                      <Link
                        to="/dealer/requests"
                        className="text-xs bg-teal-50 text-teal-700 hover:bg-teal-100 px-3 py-1.5 rounded-lg font-semibold border border-teal-200"
                      >
                        Inspect
                      </Link>
                    </td>
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

export default DealerDashboard;
