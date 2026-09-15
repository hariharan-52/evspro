import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <Leaf className="w-24 h-24 text-green-200 mb-6" />
      <h1 className="text-6xl font-bold text-green-800 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Page Not Found</h2>
      <p className="text-gray-600 mb-8 max-w-md">
        The page you are looking for doesn't exist or has been moved. 
        Let's get you back on track to saving the environment.
      </p>
      <Link 
        to="/" 
        className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-8 rounded-full transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
};

export default NotFoundPage;
