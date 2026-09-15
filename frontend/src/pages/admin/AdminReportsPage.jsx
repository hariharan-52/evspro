import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts';
import { 
  Heart, Recycle, Wind, ShieldAlert, Users, Printer, RefreshCw, 
  TrendingUp, MapPin, CheckCircle, Package, Download, FileText, ArrowUpRight
} from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const AdminReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reportData, setReportData] = useState({
    summary: {
      total_donations: 0,
      total_donation_items: 0,
      completed_donations: 0,
      received_donations: 0,
      total_recycling: 0,
      total_recycling_weight: 0,
      completed_recycling: 0,
      collected_recycling: 0,
      waste_diverted_kg: 0,
      co2_saved_kg: 0,
      impact_score: 0,
      total_users: 0,
      donors_count: 0,
      ngos_count: 0,
      dealers_count: 0,
      admins_count: 0
    },
    monthlyData: [],
    donationCategories: [],
    wasteCategories: [],
    roleData: [],
    cityData: [],
    donationStatuses: [],
    recyclingStatuses: []
  });

  const fetchReports = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.get('/admin/reports');
      if (res.data) {
        setReportData(res.data);
        if (isManual) toast.success('Platform report synchronized with live data!');
      }
    } catch (err) {
      console.error('Failed to load platform reports:', err);
      toast.error('Failed to fetch real-time reports data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const summary = reportData.summary || {};
  const monthlyData = reportData.monthlyData || [];
  const wasteCategories = (reportData.wasteCategories || []).map(c => ({
    name: c.name,
    value: parseFloat(c.value) || 1,
    count: c.count
  }));
  const donationCategories = (reportData.donationCategories || []).map(c => ({
    name: c.name,
    value: parseInt(c.value, 10) || 1,
    count: c.count
  }));
  const roleData = reportData.roleData || [];
  const cityData = reportData.cityData || [];

  const DONATION_COLORS = ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#15803d', '#14532d'];
  const RECYCLING_COLORS = ['#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#0f766e', '#115e59'];
  const ROLE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
  const CITY_COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];

  const exportDataJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ecodonate_platform_report_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Raw report exported as JSON');
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4">
        <LoadingSpinner size="large" />
        <p className="text-gray-500 font-medium text-sm">Aggregating live platform database records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 print:p-0 print:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="text-green-600" size={28} />
            Live Platform Audit & Impact Reports
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Real-time analytics computed directly from the EcoDonate database, donations, recycling logs, and user activity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchReports(true)}
            disabled={refreshing}
            className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            title="Refresh Live Data"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-green-600' : ''} />
            {refreshing ? 'Syncing...' : 'Sync Live'}
          </button>

          <button
            onClick={exportDataJson}
            className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Download size={14} /> Export JSON
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Printer size={14} /> Print Audit Report
          </button>
        </div>
      </div>

      {/* Printable Report Header */}
      <div className="hidden print:block border-b-2 border-gray-800 pb-4 mb-4">
        <h1 className="text-2xl font-bold text-gray-900">EcoDonate Environmental Impact & Operations Report</h1>
        <p className="text-xs text-gray-600 mt-1">
          Generated on: {new Date().toLocaleString()} &bull; Live Database Metrics
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard 
          title="Total Donations" 
          value={summary.total_donations} 
          icon={<Heart />} 
          color="green" 
        />
        <StatCard 
          title="Recycling Requests" 
          value={summary.total_recycling} 
          icon={<Recycle />} 
          color="teal" 
        />
        <StatCard 
          title="Waste Diverted" 
          value={`${summary.waste_diverted_kg} kg`} 
          icon={<ShieldAlert />} 
          color="yellow" 
        />
        <StatCard 
          title="CO2 Prevented" 
          value={`${summary.co2_saved_kg} kg`} 
          icon={<Wind />} 
          color="blue" 
        />
        <StatCard 
          title="Registered Users" 
          value={summary.total_users} 
          icon={<Users />} 
          color="purple" 
        />
      </div>

      {/* Activity Trend Line Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-gray-900">6-Month Activity & Volume Trend</h3>
            <p className="text-xs text-gray-500">Live comparison of donation offers vs recycling collections per month</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-green-600">
              <span className="w-3 h-3 rounded-full bg-green-500"></span> Donations
            </span>
            <span className="flex items-center gap-1.5 text-teal-600">
              <span className="w-3 h-3 rounded-full bg-teal-500"></span> Recycling (Jobs)
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="colorRecycling" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  borderRadius: '12px', 
                  border: '1px solid #e2e8f0', 
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  fontSize: '12px'
                }} 
              />
              <Area type="monotone" dataKey="donations" name="Donations" stroke="#16a34a" strokeWidth={3} fillOpacity={1} fill="url(#colorDonations)" />
              <Area type="monotone" dataKey="recycling" name="Recycling Requests" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorRecycling)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two-Column Grid: Donation Categories vs Waste Materials */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Donation Categories Breakdown */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Donation Items by Category</h3>
                <p className="text-xs text-gray-500">Live distribution of donated goods</p>
              </div>
              <span className="text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-lg border border-green-200">
                {summary.total_donation_items} total items
              </span>
            </div>

            <div className="h-64">
              {donationCategories.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">No donation category records yet</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donationCategories}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {donationCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={DONATION_COLORS[index % DONATION_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val, name, props) => [`${val} items (${props.payload.count} requests)`, name]}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100 text-xs">
            {donationCategories.slice(0, 4).map((c, i) => (
              <div key={c.name} className="flex justify-between items-center bg-gray-50 px-3 py-1.5 rounded-lg">
                <span className="text-gray-600 font-medium">{c.name}</span>
                <span className="font-bold text-gray-900">{c.count} req ({c.value} items)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recycling Waste Materials Breakdown */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Recyclable Scrap by Material</h3>
                <p className="text-xs text-gray-500">Live proportion of collected waste materials</p>
              </div>
              <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                {summary.waste_diverted_kg} kg weight
              </span>
            </div>

            <div className="h-64">
              {wasteCategories.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">No recycling material records yet</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={wasteCategories}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {wasteCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={RECYCLING_COLORS[index % RECYCLING_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val, name, props) => [`${val} kg (${props.payload.count} requests)`, name]}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100 text-xs">
            {wasteCategories.slice(0, 4).map((c, i) => (
              <div key={c.name} className="flex justify-between items-center bg-gray-50 px-3 py-1.5 rounded-lg">
                <span className="text-gray-600 font-medium">{c.name}</span>
                <span className="font-bold text-gray-900">{c.value} kg ({c.count} req)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two-Column Grid: User Roles & City Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Roles Breakdown */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-gray-900">User Role Distribution</h3>
              <p className="text-xs text-gray-500">Live active accounts in database</p>
            </div>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
              {summary.total_users} registered users
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#334155', fontWeight: 600 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={24}>
                  {roleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={ROLE_COLORS[index % ROLE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-4 border-t border-gray-100 text-xs text-center">
            <div className="bg-blue-50 p-2 rounded-lg">
              <span className="block text-gray-500 text-[11px]">Donors</span>
              <span className="font-bold text-blue-700 text-sm">{summary.donors_count}</span>
            </div>
            <div className="bg-green-50 p-2 rounded-lg">
              <span className="block text-gray-500 text-[11px]">NGOs</span>
              <span className="font-bold text-green-700 text-sm">{summary.ngos_count}</span>
            </div>
            <div className="bg-yellow-50 p-2 rounded-lg">
              <span className="block text-gray-500 text-[11px]">Dealers</span>
              <span className="font-bold text-yellow-700 text-sm">{summary.dealers_count}</span>
            </div>
            <div className="bg-purple-50 p-2 rounded-lg">
              <span className="block text-gray-500 text-[11px]">Admins</span>
              <span className="font-bold text-purple-700 text-sm">{summary.admins_count}</span>
            </div>
          </div>
        </div>

        {/* Top Active Cities */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-gray-900">Geographic Activity by City</h3>
                <p className="text-xs text-gray-500">Live requests origin locations</p>
              </div>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                Top Urban Hubs
              </span>
            </div>

            <div className="h-64">
              {cityData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">No city records yet</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cityData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                    <Bar dataKey="count" name="Total Requests" radius={[6, 6, 0, 0]} barSize={28}>
                      {cityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CITY_COLORS[index % CITY_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100 text-xs">
            {cityData.slice(0, 3).map((c, idx) => (
              <div key={c.name} className="flex items-center gap-1.5 bg-gray-50 p-2 rounded-lg">
                <MapPin size={14} className="text-indigo-600 shrink-0" />
                <div className="truncate">
                  <span className="block font-semibold text-gray-900 truncate">{c.name}</span>
                  <span className="text-[11px] text-gray-500">{c.count} activity</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Impact Statement Banner (Real Computed Metrics) */}
      <div className="bg-gradient-to-r from-green-900 to-teal-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-lg">
        <Wind className="absolute -right-6 -bottom-6 text-white/5 w-64 h-64 pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-green-300 text-xs font-semibold mb-4 backdrop-blur-xs">
            <CheckCircle size={14} /> Certified Database Impact Summary
          </div>
          <h2 className="text-2xl font-bold mb-3">Live Environmental Footprint</h2>
          <p className="text-green-100 text-sm leading-relaxed mb-4">
            Through the verified activity of <span className="text-white font-bold">{summary.total_users} registered community participants</span>, 
            EcoDonate has diverted <span className="text-white font-bold text-base">{summary.waste_diverted_kg} kg</span> of recyclable materials 
            and <span className="text-white font-bold text-base">{summary.total_donation_items} reusable items</span> away from municipal dumps.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10 text-xs">
            <div>
              <span className="block text-green-300">Prevented CO2</span>
              <span className="text-lg font-bold text-white">{summary.co2_saved_kg} kg</span>
            </div>
            <div>
              <span className="block text-green-300">Total Eco Points Awarded</span>
              <span className="text-lg font-bold text-white">{summary.impact_score} pts</span>
            </div>
            <div>
              <span className="block text-green-300">Completed Operations</span>
              <span className="text-lg font-bold text-white">{(summary.completed_donations || 0) + (summary.completed_recycling || 0)} jobs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReportsPage;
