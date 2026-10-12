import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, Recycle, Gift, Globe2, Heart, Users, MapPin } from 'lucide-react';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';

const HomePage = () => {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState({
    donations: 0,
    recycled: 0,
    diverted: 0,
    ngos: 0,
    partners: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await api.get('/impact');
      if (res.data) {
        setStats({
          donations: Number(res.data.donations ?? res.data.total_items ?? 0),
          recycled: Number(res.data.recycled ?? res.data.total_waste_kg ?? 0),
          diverted: Number(res.data.diverted ?? res.data.total_co2 ?? 0),
          ngos: Number(res.data.ngos ?? res.data.ngos_connected ?? 0),
          partners: Number(res.data.partners ?? res.data.recycling_partners ?? 0)
        });
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchStats();

    // Auto-poll every 5 seconds so live updates made by any user reflect in real-time
    const interval = setInterval(() => {
      if (isMounted) fetchStats();
    }, 5000);

    // Event listeners for window focus, custom mutation event, and cross-tab storage
    const handleUpdate = () => {
      if (isMounted) fetchStats();
    };

    const handleStorage = (e) => {
      if (e.key === 'eco_last_impact_update' && isMounted) {
        fetchStats();
      }
    };

    window.addEventListener('focus', handleUpdate);
    window.addEventListener('eco_impact_updated', handleUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', handleUpdate);
      window.removeEventListener('eco_impact_updated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const hasSavedAccount = typeof window !== 'undefined' && Boolean(
    localStorage.getItem('token') ||
    localStorage.getItem('ecodonate_remembered_email') || 
    localStorage.getItem('ecodonate_saved_accounts')
  );
  const authFallbackUrl = hasSavedAccount ? '/login' : '/register';

  const donateUrl = isAuthenticated
    ? (user?.role === 'ngo' ? '/ngo/dashboard' : user?.role === 'scrapdealer' ? '/dealer/dashboard' : user?.role === 'admin' ? '/admin/donations' : '/donate')
    : authFallbackUrl;

  const recycleUrl = isAuthenticated
    ? (user?.role === 'ngo' ? '/ngo/dashboard' : user?.role === 'scrapdealer' ? '/dealer/dashboard' : user?.role === 'admin' ? '/admin/recycling' : '/recycle')
    : authFallbackUrl;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-eco-light pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-extrabold text-green-900 mb-6 tracking-tight">
              Give Waste a <span className="text-green-600">Second Life</span>.
            </h1>
            <p className="text-xl text-gray-600 mb-10">
              Join the movement to reduce landfill waste. Donate reusable items to those in need or properly recycle your waste with our trusted partners.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={donateUrl} className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-full font-semibold text-lg flex items-center justify-center transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
                Donate Now <Heart className="ml-2 h-5 w-5" />
              </Link>
              <Link to={recycleUrl} className="bg-white hover:bg-gray-50 text-green-700 border-2 border-green-200 px-8 py-4 rounded-full font-semibold text-lg flex items-center justify-center transition-all shadow-md hover:shadow-lg hover:-translate-y-1">
                Recycle Waste <Recycle className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
           <Leaf className="w-96 h-96 text-green-500" />
        </div>
        <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/4 opacity-10 pointer-events-none">
           <Globe2 className="w-[500px] h-[500px] text-green-600" />
        </div>
      </section>

      {/* Stats Section with Live Community Data */}
      <section className="py-12 bg-white relative -mt-16 z-20 max-w-6xl mx-auto rounded-3xl shadow-xl w-[95%] border border-gray-100/80">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 px-8">
          <div className="text-center group transition-transform duration-200 hover:-translate-y-0.5">
            <div className="text-4xl font-extrabold text-green-600 mb-2">
              {loading ? (
                <span className="inline-block animate-pulse text-gray-300">...</span>
              ) : (
                `${stats.donations.toLocaleString()}${stats.donations > 0 ? '+' : ''}`
              )}
            </div>
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Items Donated</div>
          </div>

          <div className="text-center group transition-transform duration-200 hover:-translate-y-0.5">
            <div className="text-4xl font-extrabold text-teal-600 mb-2">
              {loading ? (
                <span className="inline-block animate-pulse text-gray-300">...</span>
              ) : (
                `${stats.recycled.toLocaleString(undefined, { maximumFractionDigits: 1 })}kg`
              )}
            </div>
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Waste Recycled</div>
          </div>

          <div className="text-center group transition-transform duration-200 hover:-translate-y-0.5">
            <div className="text-4xl font-extrabold text-blue-600 mb-2">
              {loading ? (
                <span className="inline-block animate-pulse text-gray-300">...</span>
              ) : (
                `${stats.diverted.toLocaleString(undefined, { maximumFractionDigits: 1 })}kg`
              )}
            </div>
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">CO2 Diverted</div>
          </div>

          <div className="text-center group transition-transform duration-200 hover:-translate-y-0.5">
            <div className="text-4xl font-extrabold text-purple-600 mb-2">
              {loading ? (
                <span className="inline-block animate-pulse text-gray-300">...</span>
              ) : (
                `${stats.ngos}${stats.ngos > 0 ? '+' : ''}`
              )}
            </div>
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">NGO Partners</div>
          </div>

          <div className="text-center group transition-transform duration-200 hover:-translate-y-0.5">
            <div className="text-4xl font-extrabold text-orange-600 mb-2">
              {loading ? (
                <span className="inline-block animate-pulse text-gray-300">...</span>
              ) : (
                `${stats.partners}${stats.partners > 0 ? '+' : ''}`
              )}
            </div>
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Scrap Dealers</div>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link to="/impact" className="text-xs font-medium text-gray-400 hover:text-green-600 transition-colors inline-flex items-center gap-1">
            Explore full verified impact report <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How EcoDonate Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Four simple steps to start making a positive impact on the environment and your community.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { title: '1. Register', desc: 'Create an account as a user, NGO, or scrap dealer.', icon: <Users /> },
              { title: '2. List Items', desc: 'Post items you want to donate or recycle.', icon: <Gift /> },
              { title: '3. Connect', desc: 'We match you with the right NGO or recycling partner.', icon: <MapPin /> },
              { title: '4. Make Impact', desc: 'Complete the pickup and track your environmental impact.', icon: <Globe2 /> }
            ].map((step, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16">
            {/* Donations */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                <Heart className="mr-3 text-red-500" /> What Can You Donate?
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {['Furniture', 'Books', 'Clothes', 'Electronics', 'Household Items'].map((cat, i) => (
                  <div key={i} className="p-4 border border-gray-100 rounded-xl bg-gray-50 text-center font-medium text-gray-800 hover:bg-green-50 hover:text-green-700 transition-colors cursor-pointer">
                    {cat}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Recycling */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                <Recycle className="mr-3 text-teal-500" /> What Can You Recycle?
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {['Plastic', 'Paper', 'Metal', 'Glass', 'E-Waste', 'Cardboard'].map((cat, i) => (
                  <div key={i} className="p-4 border border-gray-100 rounded-xl bg-gray-50 text-center font-medium text-gray-800 hover:bg-teal-50 hover:text-teal-700 transition-colors cursor-pointer">
                    {cat}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-green-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why EcoDonate?</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
             <div className="text-center">
               <div className="bg-green-800 p-4 rounded-full inline-block mb-4"><Leaf size={32} className="text-green-300" /></div>
               <h3 className="text-xl font-semibold mb-2">Reduce Waste</h3>
               <p className="text-green-100">Keep usable items and recyclables out of overflowing landfills.</p>
             </div>
             <div className="text-center">
               <div className="bg-green-800 p-4 rounded-full inline-block mb-4"><Heart size={32} className="text-green-300" /></div>
               <h3 className="text-xl font-semibold mb-2">Support Communities</h3>
               <p className="text-green-100">Help NGOs acquire necessary goods for underprivileged communities.</p>
             </div>
             <div className="text-center">
               <div className="bg-green-800 p-4 rounded-full inline-block mb-4"><Recycle size={32} className="text-green-300" /></div>
               <h3 className="text-xl font-semibold mb-2">Encourage Recycling</h3>
               <p className="text-green-100">Streamline the connection with authorized local scrap dealers.</p>
             </div>
             <div className="text-center">
               <div className="bg-green-800 p-4 rounded-full inline-block mb-4"><Globe2 size={32} className="text-green-300" /></div>
               <h3 className="text-xl font-semibold mb-2">Protect Environment</h3>
               <p className="text-green-100">Lower carbon emissions and preserve precious natural resources.</p>
             </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gray-50 text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-6">Start making an impact today.</h2>
        <Link to={donateUrl} className="inline-flex items-center justify-center bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-colors">
          Get Started <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
      </section>
    </div>
  );
};

export default HomePage;
