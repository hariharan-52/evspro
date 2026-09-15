import React from 'react';
import { getStatusColor } from '../../utils/helpers';

const StatusBadge = ({ status }) => {
  const color = getStatusColor(status);
  
  const colorStyles = {
    yellow: 'bg-yellow-100 text-yellow-800',
    blue: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
    indigo: 'bg-indigo-100 text-indigo-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    gray: 'bg-gray-100 text-gray-800'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${colorStyles[color] || colorStyles.gray}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
