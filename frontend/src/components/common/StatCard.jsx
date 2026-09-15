import React from 'react';

const StatCard = ({ title, value, icon, trend, trendLabel, color = 'green' }) => {
  const colorStyles = {
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center">
      <div className={`p-4 rounded-full mr-4 ${colorStyles[color] || colorStyles.green}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h4 className="text-2xl font-bold text-gray-900">{value}</h4>
        {trend && (
          <p className={`text-sm mt-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? '+' : ''}{trend}% {trendLabel && <span className="text-gray-500">{trendLabel}</span>}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
