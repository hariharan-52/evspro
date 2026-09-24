import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Building2, Truck, Leaf, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';
import { RECYCLING_CATEGORIES } from '../../utils/constants';
import LiveLocationButton from '../../components/common/LiveLocationButton';

const RegisterPage = () => {
  const [role, setRole] = useState('user');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRole, setSubmittedRole] = useState(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Unified form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    
    // NGO & Dealer specific
    contactPerson: '',
    registrationNumber: '',
    description: '',
    
    // Dealer specific
    acceptedMaterials: []
  });

  const handleMaterialToggle = (material) => {
    setFormData(prev => ({
      ...prev,
      acceptedMaterials: prev.acceptedMaterials.includes(material)
        ? prev.acceptedMaterials.filter(m => m !== material)
        : [...prev.acceptedMaterials, material]
    }));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setIsSubmitting(true);
    
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        role,
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
      };
      
      if (role === 'ngo') {
        payload.ngo_name = formData.name;
        payload.registration_number = formData.registrationNumber;
        payload.contact_person = formData.contactPerson;
        payload.description = formData.description;
      }
      if (role === 'scrapdealer') {
        payload.business_name = formData.name;
        payload.registration_number = formData.registrationNumber;
        payload.contact_person = formData.contactPerson;
        payload.accepted_materials = formData.acceptedMaterials;
      }
      
      const res = await register(payload);
      
      if (role === 'ngo') {
        toast.success('Registration successful! Welcome to your NGO dashboard.');
        navigate('/ngo/dashboard');
      } else if (role === 'scrapdealer') {
        toast.success('Registration successful! Welcome to your Scrap Dealer dashboard.');
        navigate('/dealer/dashboard');
      } else {
        toast.success('Registration successful! Welcome to EcoDonate.');
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Registration error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success Modal for NGO & Scrap Dealer
  if (submittedRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-md border border-gray-100 text-center space-y-6">
          <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
            <Clock size={36} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Application Submitted!</h2>
            <p className="text-sm text-gray-600 mt-2">
              Thank you for registering as a <span className="font-semibold text-green-700">{submittedRole === 'ngo' ? 'Non-Profit NGO' : 'Scrap Dealer / Recycler'}</span> on EcoDonate.
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left text-xs text-amber-800 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <Clock size={16} />
              <span>Admin Verification Required</span>
            </div>
            <p>
              To ensure trust and transparency on EcoDonate, all {submittedRole === 'ngo' ? 'NGOs' : 'Scrap Dealers'} must be verified by our platform administrator before activation.
            </p>
            <p>
              Once your registration is reviewed and approved by an Admin, you will be able to sign in and start handling {submittedRole === 'ngo' ? 'donations' : 'recycling requests'}.
            </p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 shadow-sm flex items-center justify-center gap-2"
          >
            <span>Proceed to Login</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="text-center">
          <Leaf className="mx-auto h-12 w-12 text-green-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Create your account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-green-600 hover:text-green-500">
              Sign in
            </Link>
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="flex border-b border-gray-200 mb-8">
          <button 
            type="button"
            className={`flex-1 py-4 flex justify-center items-center gap-2 border-b-2 font-medium text-sm transition-colors ${role === 'user' ? 'border-green-600 text-green-600 bg-green-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            onClick={() => setRole('user')}
          >
            <User size={18} /> Regular User
          </button>
          <button 
            type="button"
            className={`flex-1 py-4 flex justify-center items-center gap-2 border-b-2 font-medium text-sm transition-colors ${role === 'ngo' ? 'border-green-600 text-green-600 bg-green-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            onClick={() => setRole('ngo')}
          >
            <Building2 size={18} /> NGO (Admin Approved)
          </button>
          <button 
            type="button"
            className={`flex-1 py-4 flex justify-center items-center gap-2 border-b-2 font-medium text-sm transition-colors ${role === 'scrapdealer' ? 'border-green-600 text-green-600 bg-green-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            onClick={() => setRole('scrapdealer')}
          >
            <Truck size={18} /> Scrap Dealer (Admin Approved)
          </button>
        </div>

        {/* Info notice for NGO / Scrap Dealer */}
        {(role === 'ngo' || role === 'scrapdealer') && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-blue-800">
            <Clock size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900">Admin Approval Notice</p>
              <p className="mt-0.5">
                {role === 'ngo' ? 'NGO' : 'Scrap Dealer'} accounts require admin verification before activation. You will be able to access the dashboard once approved.
              </p>
            </div>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {role === 'user' ? 'Full Name' : role === 'ngo' ? 'NGO Organization Name' : 'Scrap Dealer / Business Name'}
              </label>
              <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" />
            </div>

            {(role === 'ngo' || role === 'scrapdealer') && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Authorized Contact Person</label>
                <input required type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" />
            </div>

            {(role === 'ngo' || role === 'scrapdealer') && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Government Registration / GST / License Number</label>
                <input required type="text" name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" />
              </div>
            )}

            {role === 'ngo' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">NGO Mission & Description</label>
                <textarea required name="description" rows="3" value={formData.description} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" placeholder="Briefly describe your NGO's purpose and community impact..."></textarea>
              </div>
            )}

            {role === 'scrapdealer' && (
              <div className="md:col-span-2 mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-3">Accepted Waste Materials</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {RECYCLING_CATEGORIES.map(cat => (
                    <label key={cat} className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        className="rounded text-green-600 focus:ring-green-500"
                        checked={formData.acceptedMaterials.includes(cat)}
                        onChange={() => handleMaterialToggle(cat)}
                      />
                      <span className="text-sm text-gray-700">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="md:col-span-2 pt-2 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Location & Address</h4>
                <p className="text-xs text-gray-500">Auto-fill with device GPS or enter manually</p>
              </div>
              <LiveLocationButton
                color="green"
                label="Share Live Location"
                onLocationDetected={(loc) => {
                  setFormData(prev => ({
                    ...prev,
                    address: loc.address || prev.address,
                    city: loc.city || prev.city,
                    state: loc.state || prev.state,
                    pincode: loc.pincode || prev.pincode
                  }));
                }}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address / Street</label>
              <input required type="text" name="address" value={formData.address} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input required type="text" name="city" value={formData.city} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                 <input required type="text" name="state" value={formData.state} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                 <input required type="text" name="pincode" value={formData.pincode} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" />
               </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input required type="password" name="password" value={formData.password} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input required type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || (role === 'scrapdealer' && formData.acceptedMaterials.length === 0)}
            className="w-full py-3 px-4 rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70"
          >
            {isSubmitting ? 'Submitting Application...' : role === 'user' ? 'Register Account' : 'Submit Registration for Admin Approval'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
