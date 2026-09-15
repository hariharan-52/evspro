import React from 'react';
import { InboxIcon } from 'lucide-react';

const EmptyState = ({ icon, title, description, action, message }) => {
  // Support both { title, description } and simple { message } usage
  const displayTitle = title || 'No data found';
  const displayDescription = description || message || 'Nothing to show here yet.';
  const displayIcon = icon || <InboxIcon size={32} />;

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="p-4 bg-gray-50 rounded-full text-gray-300 mb-4">
        {displayIcon}
      </div>
      <h3 className="text-lg font-medium text-gray-700 mb-2">{displayTitle}</h3>
      <p className="text-sm text-gray-400 mb-6 max-w-sm">{displayDescription}</p>
      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
