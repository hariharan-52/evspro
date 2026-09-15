import React from 'react';
import { Leaf, Target, Heart, Shield } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="bg-green-50 py-20 text-center px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">About EcoDonate</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          We are on a mission to build a zero-waste future by connecting mindful individuals with organizations that can give their items a second life.
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Problem & Solution */}
        <div className="grid md:grid-cols-2 gap-16 mb-24">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
               The Problem
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Every year, millions of tons of usable items and recyclable materials end up in landfills. At the same time, numerous NGOs struggle to find resources for the communities they support, and the recycling industry faces challenges in efficient collection.
            </p>
            <p className="text-gray-600 leading-relaxed">
              This massive disconnect not only harms our environment through increased carbon emissions and resource depletion but also represents a huge missed opportunity for social good.
            </p>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">The Solution</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              EcoDonate bridges this gap. Our platform serves as a centralized hub connecting regular users, NGOs, and authorized scrap dealers. 
            </p>
            <p className="text-gray-600 leading-relaxed">
              Whether it's an old sofa that can furnish a shelter, clothes for those in need, or plastic waste ready for processing, we ensure everything finds its right destination. Simple, transparent, and impactful.
            </p>
          </div>
        </div>

        {/* Objectives */}
        <div className="mb-24">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Our Objectives</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-8 rounded-2xl">
              <Leaf className="w-12 h-12 text-green-500 mb-6" />
              <h3 className="text-xl font-bold mb-4">Environmental Sustainability</h3>
              <p className="text-gray-600">Reduce carbon footprint by maximizing reuse and optimizing the recycling supply chain.</p>
            </div>
            <div className="bg-gray-50 p-8 rounded-2xl">
              <Heart className="w-12 h-12 text-red-500 mb-6" />
              <h3 className="text-xl font-bold mb-4">Social Impact</h3>
              <p className="text-gray-600">Empower NGOs by providing them a steady stream of donations tailored to their needs.</p>
            </div>
            <div className="bg-gray-50 p-8 rounded-2xl">
              <Shield className="w-12 h-12 text-blue-500 mb-6" />
              <h3 className="text-xl font-bold mb-4">Trust & Transparency</h3>
              <p className="text-gray-600">Ensure all partners are verified and users can track the journey of their items.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AboutPage;
