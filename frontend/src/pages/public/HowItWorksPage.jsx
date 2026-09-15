import React, { useState } from 'react';
import { User, Building2, Truck, ShieldCheck } from 'lucide-react';

const HowItWorksPage = () => {
  const [activeTab, setActiveTab] = useState('user');

  const content = {
    user: [
      { step: 1, title: 'Sign Up', desc: 'Create a free user account to start your eco-journey.' },
      { step: 2, title: 'List Item', desc: 'Take a photo, add details, and choose whether to donate or recycle.' },
      { step: 3, title: 'Get Matched', desc: 'Our system notifies relevant NGOs or scrap dealers in your area.' },
      { step: 4, title: 'Pickup & Impact', desc: 'The item is collected. You can track its status and see your environmental impact score grow!' }
    ],
    ngo: [
      { step: 1, title: 'Register', desc: 'Sign up and provide your NGO registration details.' },
      { step: 2, title: 'Get Verified', desc: 'Our team verifies your credentials to ensure trust.' },
      { step: 3, title: 'Browse Requests', desc: 'View local donation requests that match your needs.' },
      { step: 4, title: 'Collect & Update', desc: 'Accept a request, coordinate pickup, and mark it as received.' }
    ],
    dealer: [
      { step: 1, title: 'Register', desc: 'Create an account and list the materials you accept.' },
      { step: 2, title: 'Get Verified', desc: 'Upload your business licenses for admin verification.' },
      { step: 3, title: 'Receive Leads', desc: 'Get notified about bulk recyclable waste in your locality.' },
      { step: 4, title: 'Process Waste', desc: 'Pick up the materials and update the status on your dashboard.' }
    ]
  };

  return (
    <div className="bg-gray-50 py-16 min-h-screen">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">How EcoDonate Works</h1>
          <p className="text-lg text-gray-600">Choose your role to see how you can use the platform.</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <button 
            onClick={() => setActiveTab('user')}
            className={`flex items-center px-6 py-3 rounded-full font-medium transition-all ${activeTab === 'user' ? 'bg-green-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-green-50'}`}
          >
            <User className="mr-2" size={20} /> For Users
          </button>
          <button 
            onClick={() => setActiveTab('ngo')}
            className={`flex items-center px-6 py-3 rounded-full font-medium transition-all ${activeTab === 'ngo' ? 'bg-green-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-green-50'}`}
          >
            <Building2 className="mr-2" size={20} /> For NGOs
          </button>
          <button 
            onClick={() => setActiveTab('dealer')}
            className={`flex items-center px-6 py-3 rounded-full font-medium transition-all ${activeTab === 'dealer' ? 'bg-green-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-green-50'}`}
          >
            <Truck className="mr-2" size={20} /> For Scrap Dealers
          </button>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
          <div className="relative">
             {/* Vertical line */}
             <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-green-100 -translate-x-1/2"></div>
             
             <div className="space-y-12">
               {content[activeTab].map((item, index) => (
                 <div key={index} className={`relative flex flex-col md:flex-row items-center ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                    {/* Circle */}
                    <div className="absolute left-1/2 -translate-x-1/2 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg z-10 hidden md:flex border-4 border-white">
                      {item.step}
                    </div>
                    
                    {/* Content Box */}
                    <div className={`md:w-1/2 flex ${index % 2 === 0 ? 'md:justify-start md:pl-12' : 'md:justify-end md:pr-12'} w-full`}>
                      <div className="bg-gray-50 p-6 rounded-2xl w-full max-w-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="w-8 h-8 bg-green-200 text-green-800 rounded-full flex items-center justify-center font-bold text-sm mb-4 md:hidden">
                          {item.step}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                        <p className="text-gray-600">{item.desc}</p>
                      </div>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HowItWorksPage;
