import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { TreePine, CloudRain, Zap, Award } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';

const COLORS = ['#14b8a6', '#0ea5e9', '#8b5cf6', '#f59e0b', '#64748b', '#ef4444', '#22c55e'];

const ImpactPage = () => {
  const [impact, setImpact] = useState({ total_items: 0, total_waste_kg: 0, total_co2: 0, total_score: 0 });
  const [donations, setDonations] = useState([]);
  const [recycling, setRecycling] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [impactRes, donationsRes, recyclingRes] = await Promise.all([
          api.get('/impact/user'),
          api.get('/donations/my'),
          api.get('/recycling'),
        ]);
        setImpact(impactRes.data);
        setDonations(Array.isArray(donationsRes.data) ? donationsRes.data : []);
        setRecycling(Array.isArray(recyclingRes.data) ? recyclingRes.data : []);
      } catch (err) {
        // Keep defaults
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calculate eco warrior level based on score
  const getLevel = (score) => {
    if (score >= 500) return 5;
    if (score >= 200) return 4;
    if (score >= 100) return 3;
    if (score >= 25) return 2;
    if (score > 0) return 1;
    return 0;
  };
  const level = getLevel(impact.total_score);

  // Build bar chart data from real donations/recycling grouped by month
  const buildBarData = () => {
    const monthMap = {};
    const now = new Date();
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('default', { month: 'short' });
      monthMap[key] = { name: key, donations: 0, recycling: 0 };
    }
    donations.forEach(d => {
      const date = new Date(d.created_at);
      const key = date.toLocaleString('default', { month: 'short' });
      if (monthMap[key]) {
        monthMap[key].donations += (d.quantity || 1);
      }
    });
    recycling.forEach(r => {
      const date = new Date(r.created_at);
      const key = date.toLocaleString('default', { month: 'short' });
      if (monthMap[key]) {
        monthMap[key].recycling += (r.quantity || 0);
      }
    });
    return Object.values(monthMap);
  };

  // Build pie chart from recycling waste categories
  const buildPieData = () => {
    const catMap = {};
    recycling.forEach(r => {
      const cat = r.waste_category || 'Other';
      catMap[cat] = (catMap[cat] || 0) + (r.quantity || 0);
    });
    // Also count donation categories
    donations.forEach(d => {
      const cat = d.category || 'Other';
      catMap[cat] = (catMap[cat] || 0) + (d.quantity || 1);
    });
    return Object.entries(catMap).map(([name, value]) => ({ name, value }));
  };

  const barData = buildBarData();
  const pieData = buildPieData();
  const treesEquivalent = Math.max(1, Math.round((impact.total_co2 || 0) / 12));
  const hasData = donations.length > 0 || recycling.length > 0;

  if (loading) {
    return <div className="flex justify-center py-20"><LoadingSpinner size="large" /></div>;
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Environmental Impact</h1>
          <p className="text-gray-500">See how your actions are saving the planet.</p>
        </div>
        {level > 0 && (
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-bold flex items-center border border-green-200 shadow-sm">
            <Award className="mr-2" /> Eco Warrior Level {level}
          </div>
        )}
      </div>

      {/* Impact Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Items Donated" value={donations.length} icon={<TreePine />} color="green" />
        <StatCard title="Waste Recycled" value={`${impact.total_waste_kg || recycling.reduce((s, r) => s + (r.quantity || 0), 0)} kg`} icon={<Zap />} color="teal" />
        <StatCard title="CO2 Saved" value={`${impact.total_co2 || 0} kg`} icon={<CloudRain />} color="blue" />
        <StatCard title="Impact Score" value={impact.total_score || 0} icon={<Award />} color="purple" />
      </div>

      {hasData ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Activity Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Activity Last 6 Months</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                    <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Legend />
                    <Bar dataKey="donations" name="Donations (items)" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="recycling" name="Recycling (kg)" fill="#14b8a6" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Category Breakdown</h3>
              {pieData.length > 0 ? (
                <div className="h-80 flex items-center">
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend */}
                  <div className="flex flex-col gap-2 ml-4">
                    {pieData.map((entry, index) => (
                      <div key={entry.name} className="flex items-center text-sm text-gray-600">
                        <div className="w-3 h-3 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        {entry.name} ({entry.value})
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-gray-500">
                  No data yet. Start donating or recycling to see breakdown.
                </div>
              )}
            </div>
          </div>

          <div className="bg-green-900 rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-2xl font-bold mb-3">You're making a real difference!</h2>
              <p className="text-green-100 mb-0 leading-relaxed">
                Your CO2 savings are equivalent to planting <span className="font-bold text-white text-xl mx-1">{treesEquivalent}</span> trees and letting them grow for 10 years. 
                Keep up the amazing work connecting resources with those who need them.
              </p>
            </div>
            <TreePine className="absolute right-0 bottom-0 text-green-800 w-48 h-48 translate-x-8 translate-y-8" />
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <TreePine className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Impact Data Yet</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Start making a difference! Donate items or recycle waste to see your environmental impact grow here.
          </p>
        </div>
      )}
    </div>
  );
};

export default ImpactPage;
