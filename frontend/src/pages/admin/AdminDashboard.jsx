import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Building2, Truck, ShieldAlert, Heart, Recycle, CheckCircle, Wind, Check, X, ArrowRight, Clock, AlertTriangle } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { formatDate } from '../../utils/helpers';

const COLORS = ['#22c55e', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#f97316'];

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [pendingItems, setPendingItems] = useState({ ngos: [], scrapDealers: [] });
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchData = async () => {
    try {
      const [statsRes, monthlyRes, categoryRes, pendingRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/stats/monthly'),
        api.get('/admin/stats/waste-categories'),
        api.get('/admin/verifications/pending')
      ]);
      setStats(statsRes.data);

      const donMap = {};
      const recMap = {};
      (monthlyRes.data.donations || []).forEach(d => { donMap[d.month] = d.count; });
      (monthlyRes.data.recycling || []).forEach(r => { recMap[r.month] = r.count; });
      const months = [...new Set([...Object.keys(donMap), ...Object.keys(recMap)])].sort();
      setMonthlyData(months.map(m => ({
        name: m.slice(5),
        donations: donMap[m] || 0,
        recycling: recMap[m] || 0,
      })));

      setCategoryData(categoryRes.data || []);
      setPendingItems({
        ngos: pendingRes.data?.ngos || [],
        scrapDealers: pendingRes.data?.scrapDealers || []
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApproveNGO = async (id) => {
    setProcessingId(`ngo-${id}`);
    try {
      await api.patch(`/ngos/${id}/verify`, { status: 'approved' });
      toast.success('NGO registration approved successfully!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveDealer = async (id) => {
    setProcessingId(`dealer-${id}`);
    try {
      await api.patch(`/scrap-dealers/${id}/verify`, { status: 'approved' });
      toast.success('Scrap Dealer registration approved successfully!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>;

  const totalPending = (pendingItems.ngos.length + pendingItems.scrapDealers.length);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Platform Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of platform metrics, environmental impact, and pending verification requests.</p>
      </div>

      {/* Pending Verifications Banner (if any) */}
      {totalPending > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
              <Clock className="animate-pulse" size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                {totalPending} Registration{totalPending > 1 ? 's' : ''} Awaiting Admin Approval
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                {pendingItems.ngos.length} NGO(s) and {pendingItems.scrapDealers.length} Scrap Dealer(s) require review before they can log in.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/ngos"
              className="px-3 py-1.5 bg-white border border-amber-300 text-amber-900 rounded-lg text-xs font-semibold hover:bg-amber-100 transition-colors"
            >
              Review NGOs
            </Link>
            <Link
              to="/admin/scrap-dealers"
              className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition-colors shadow-xs"
            >
              Review Scrap Dealers
            </Link>
          </div>
        </div>
      )}

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats?.users || 0} icon={<Users />} color="blue" />
        <StatCard title="Registered NGOs" value={stats?.ngos || 0} icon={<Building2 />} color="green" />
        <StatCard title="Scrap Dealers" value={stats?.dealers || 0} icon={<Truck />} color="purple" />
        <StatCard title="Pending Approvals" value={stats?.pending_verifications || totalPending} icon={<ShieldAlert />} color={totalPending > 0 ? "red" : "blue"} />
        <StatCard title="Total Donations" value={stats?.donations || 0} icon={<Heart />} color="green" />
        <StatCard title="Recycling Requests" value={stats?.recycling || 0} icon={<Recycle />} color="teal" />
        <StatCard title="Completed Items" value={stats?.completed_donations || 0} icon={<CheckCircle />} color="blue" />
        <StatCard title="Waste Diverted (kg)" value={Number(stats?.waste_diverted_kg || 0).toFixed(1)} icon={<Wind />} color="purple" />
      </div>

      {/* Quick Action Pending Approvals Queue */}
      {totalPending > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-2">
              <ShieldAlert className="text-amber-600" size={20} />
              <h3 className="font-bold text-gray-900 text-base">Immediate Approval Queue</h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full">
              {totalPending} Action Required
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Organization / Business</th>
                  <th className="px-6 py-3">Reg #</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">City</th>
                  <th className="px-6 py-3 text-right">Instant Approval</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {/* Pending NGOs */}
                {pendingItems.ngos.map(ngo => (
                  <tr key={`ngo-${ngo.id}`} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-200">
                        <Building2 size={12} /> NGO
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-gray-900">{ngo.ngo_name || ngo.name}</p>
                      <p className="text-xs text-gray-500">Rep: {ngo.contact_person || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs text-gray-700 font-semibold">
                      {ngo.registration_number || 'N/A'}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-gray-700">
                      <p className="font-medium text-gray-900">{ngo.email}</p>
                      <p className="text-gray-500">{ngo.phone}</p>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-gray-700 font-medium">
                      {ngo.city}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to="/admin/ngos"
                          className="px-2.5 py-1 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleApproveNGO(ngo.id)}
                          disabled={processingId === `ngo-${ngo.id}`}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors disabled:opacity-50"
                        >
                          <Check size={14} /> Approve
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Pending Scrap Dealers */}
                {pendingItems.scrapDealers.map(dealer => (
                  <tr key={`dealer-${dealer.id}`} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                        <Truck size={12} /> Scrap Dealer
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-gray-900">{dealer.business_name || dealer.name}</p>
                      <p className="text-xs text-gray-500">Rep: {dealer.contact_person || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs text-gray-700 font-semibold">
                      {dealer.registration_number || 'N/A'}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-gray-700">
                      <p className="font-medium text-gray-900">{dealer.email}</p>
                      <p className="text-gray-500">{dealer.phone}</p>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-gray-700 font-medium">
                      {dealer.city}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to="/admin/scrap-dealers"
                          className="px-2.5 py-1 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleApproveDealer(dealer.id)}
                          disabled={processingId === `dealer-${dealer.id}`}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors disabled:opacity-50"
                        >
                          <Check size={14} /> Approve
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Activity Trend (Monthly)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <RechartsTooltip />
                <Legend />
                <Line type="monotone" dataKey="donations" name="Donations" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="recycling" name="Recycling" stroke="#14b8a6" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Waste Categories</h3>
          {categoryData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-400">No recycling data yet</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
