import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Building2,
  Truck,
  Leaf,
  Mail,
  Lock,
  Phone,
  MapPin,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  Compass
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';
import { RECYCLING_CATEGORIES } from '../../utils/constants';
import LiveLocationButton from '../../components/common/LiveLocationButton';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const RegisterPage = () => {
  // Steps: 'form' | 'success' | 'pending'
  const [currentStep, setCurrentStep] = useState('form');

  // Role: 'user' | 'ngo' | 'scrapdealer' (ADMIN IS STRICTLY EXCLUDED)
  const [role, setRole] = useState('user');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // NGO Specific Fields
  const [ngoName, setNgoName] = useState('');
  const [ngoContactPerson, setNgoContactPerson] = useState('');
  const [ngoRegNumber, setNgoRegNumber] = useState('');
  const [ngoDescription, setNgoDescription] = useState('');

  // Scrap Dealer Specific Fields
  const [dealerBusinessName, setDealerBusinessName] = useState('');
  const [dealerContactPerson, setDealerContactPerson] = useState('');
  const [dealerRegNumber, setDealerRegNumber] = useState('');
  const [acceptedMaterials, setAcceptedMaterials] = useState(['Plastic', 'Paper', 'Metal']);

  // Loading & Error States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { registerRequest, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') navigate('/admin/dashboard', { replace: true });
      else if (user.role === 'ngo') navigate('/ngo/dashboard', { replace: true });
      else if (user.role === 'scrapdealer') navigate('/dealer/dashboard', { replace: true });
      else navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Calculate password strength (0 to 4)
  const getPasswordStrength = (pwd) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    return score;
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthLabels = ['Too weak', 'Fair', 'Good', 'Strong', 'Ultra Strong'];
  const strengthColors = ['bg-rose-500', 'bg-amber-500', 'bg-emerald-500', 'bg-teal-500', 'bg-green-600'];

  const handleMaterialToggle = (material) => {
    setAcceptedMaterials((prev) =>
      prev.includes(material)
        ? prev.filter((m) => m !== material)
        : [...prev, material]
    );
  };

  // Direct Registration Form Submit
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setError('');

    // Common validations
    if (!name.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!email.trim()) {
      setError('Please provide a valid email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address (e.g. name@example.com).');
      return;
    }
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      setError('Please enter a valid 10-digit mobile phone number.');
      return;
    }
    if (!address.trim()) {
      setError('Please enter your complete street address.');
      return;
    }
    if (!password) {
      setError('Please create a password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your entries.');
      return;
    }

    // Role-specific validations
    if (role === 'ngo') {
      if (!ngoName.trim()) {
        setError('Please enter the official NGO / Organization Name.');
        return;
      }
      if (!ngoContactPerson.trim()) {
        setError('Please enter the Contact Person Name.');
        return;
      }
      if (!ngoRegNumber.trim()) {
        setError('Please provide the NGO Registration / 12A / 80G Certificate Number.');
        return;
      }
    } else if (role === 'scrapdealer') {
      if (!dealerBusinessName.trim()) {
        setError('Please enter the Scrap Dealer / Business Name.');
        return;
      }
      if (!dealerContactPerson.trim()) {
        setError('Please enter the Owner / Contact Person Name.');
        return;
      }
      if (!dealerRegNumber.trim()) {
        setError('Please enter the Trade License / GST / Registration Number.');
        return;
      }
      if (acceptedMaterials.length === 0) {
        setError('Please select at least one recyclable material you accept.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        role,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        password,
        confirmPassword
      };

      if (role === 'ngo') {
        payload.ngo_name = ngoName.trim();
        payload.contact_person = ngoContactPerson.trim();
        payload.registration_number = ngoRegNumber.trim();
        payload.description = ngoDescription.trim();
      } else if (role === 'scrapdealer') {
        payload.business_name = dealerBusinessName.trim();
        payload.contact_person = dealerContactPerson.trim();
        payload.registration_number = dealerRegNumber.trim();
        payload.accepted_materials = acceptedMaterials;
      }

      const res = await registerRequest(payload);
      toast.success(res.message || 'Account registered successfully!');

      if (role === 'user') {
        setCurrentStep('success');
      } else {
        setCurrentStep('pending');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit registration. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-teal-50/30 py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Ambient background blur elements for elite visual depth */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -left-36 w-96 h-96 bg-teal-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphic Container */}
      <div className="relative max-w-3xl mx-auto bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_70px_-15px_rgba(16,185,129,0.14),0_10px_30px_-5px_rgba(0,0,0,0.04)] border border-emerald-100/80 p-6 sm:p-12 transition-all">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            Create Your <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 bg-clip-text text-transparent">EcoDonate</span> Account
          </h1>
        </div>

        {/* Global Error Notice */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-sm text-rose-700 flex items-start gap-3 animate-fadeIn shadow-xs">
            <AlertCircle size={20} className="text-rose-500 flex-shrink-0 mt-0.5" />
            <div className="font-semibold leading-relaxed">{error}</div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* SCREEN 1: REGISTRATION FORM */}
        {/* ===================================================================== */}
        {currentStep === 'form' && (
          <form onSubmit={handleSubmitForm} className="space-y-8">

            {/* ELITE ROLE SELECTOR */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-black uppercase tracking-wider text-gray-500">
                  Select Your Account Role <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {role === 'user' ? '✨ Donor Account' : role === 'ngo' ? '🏢 NGO / Charity' : '♻️ Scrap Dealer'}
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* 1. Individual User */}
                <button
                  type="button"
                  onClick={() => { setRole('user'); setError(''); }}
                  className={`p-4 rounded-2xl border text-left transition-all duration-200 relative flex flex-col justify-between ${
                    role === 'user'
                      ? 'border-emerald-500 bg-gradient-to-b from-emerald-50/90 to-teal-50/30 ring-2 ring-emerald-500/20 shadow-md shadow-emerald-500/10'
                      : 'border-gray-200/90 bg-white/70 hover:border-gray-300 hover:bg-gray-50/50 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-xl transition-all ${
                      role === 'user'
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <User size={19} />
                    </div>
                    {role === 'user' && (
                      <span className="inline-flex items-center text-emerald-600 bg-emerald-100/90 rounded-full p-1">
                        <CheckCircle2 size={15} />
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                      <span>Donor & Citizen</span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Donate items, schedule doorstep scrap pickup & earn EcoPoints.
                    </p>
                  </div>
                </button>

                {/* 2. NGO Organization */}
                <button
                  type="button"
                  onClick={() => { setRole('ngo'); setError(''); }}
                  className={`p-4 rounded-2xl border text-left transition-all duration-200 relative flex flex-col justify-between ${
                    role === 'ngo'
                      ? 'border-emerald-500 bg-gradient-to-b from-emerald-50/90 to-teal-50/30 ring-2 ring-emerald-500/20 shadow-md shadow-emerald-500/10'
                      : 'border-gray-200/90 bg-white/70 hover:border-gray-300 hover:bg-gray-50/50 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-xl transition-all ${
                      role === 'ngo'
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Building2 size={19} />
                    </div>
                    {role === 'ngo' && (
                      <span className="inline-flex items-center text-emerald-600 bg-emerald-100/90 rounded-full p-1">
                        <CheckCircle2 size={15} />
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">
                      NGO / Non-Profit
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Receive verified items, food & clothes for community distribution.
                    </p>
                  </div>
                </button>

                {/* 3. Scrap Dealer */}
                <button
                  type="button"
                  onClick={() => { setRole('scrapdealer'); setError(''); }}
                  className={`p-4 rounded-2xl border text-left transition-all duration-200 relative flex flex-col justify-between ${
                    role === 'scrapdealer'
                      ? 'border-emerald-500 bg-gradient-to-b from-emerald-50/90 to-teal-50/30 ring-2 ring-emerald-500/20 shadow-md shadow-emerald-500/10'
                      : 'border-gray-200/90 bg-white/70 hover:border-gray-300 hover:bg-gray-50/50 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-xl transition-all ${
                      role === 'scrapdealer'
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Truck size={19} />
                    </div>
                    {role === 'scrapdealer' && (
                      <span className="inline-flex items-center text-emerald-600 bg-emerald-100/90 rounded-full p-1">
                        <CheckCircle2 size={15} />
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">
                      Scrap Dealer
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Accept pickup orders, collect recyclable waste & trade materials.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* SECTION 1: Personal Information Card */}
            <div className="p-6 rounded-3xl bg-slate-50/60 border border-slate-200/70 space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs">1</span>
                <h2 className="text-xs font-black uppercase tracking-wider text-gray-700">
                  Personal Information
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    {role === 'ngo' ? 'Representative Name' : role === 'scrapdealer' ? 'Owner Name' : 'Full Name'} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 shadow-2xs focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                    <input
                      type="email"
                      required
                      placeholder="e.g. rahul@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 shadow-2xs focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Mobile Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210 (10 digits)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 shadow-2xs focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: Role-Specific Verification Details (Conditional) */}
            {role === 'ngo' && (
              <div className="p-6 rounded-3xl bg-emerald-50/40 border border-emerald-200/80 space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs">2</span>
                  <h2 className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <Building2 size={15} /> NGO Verification & Accreditation
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Official NGO Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Green Earth Foundation"
                      value={ngoName}
                      onChange={(e) => setNgoName(e.target.value)}
                      className="block w-full px-3.5 py-3 bg-white border border-emerald-200 rounded-xl text-sm text-gray-900 shadow-2xs focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Contact Person Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Suresh Patel"
                      value={ngoContactPerson}
                      onChange={(e) => setNgoContactPerson(e.target.value)}
                      className="block w-full px-3.5 py-3 bg-white border border-emerald-200 rounded-xl text-sm text-gray-900 shadow-2xs focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Registration / Trust / 80G Certificate Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NGO-REG-2024-9843"
                    value={ngoRegNumber}
                    onChange={(e) => setNgoRegNumber(e.target.value)}
                    className="block w-full px-3.5 py-3 bg-white border border-emerald-200 rounded-xl text-sm text-gray-900 shadow-2xs focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-mono"
                  />
                  <p className="mt-1 text-[11px] text-gray-500">
                    Administrator will verify this number before activating your NGO dashboard access.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Organization Mission & Causes Supported
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Briefly describe your NGO's social mission, causes supported, or community programs..."
                    value={ngoDescription}
                    onChange={(e) => setNgoDescription(e.target.value)}
                    className="block w-full px-3.5 py-2.5 bg-white border border-emerald-200 rounded-xl text-sm text-gray-900 shadow-2xs focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all resize-none"
                  />
                </div>
              </div>
            )}

            {role === 'scrapdealer' && (
              <div className="p-6 rounded-3xl bg-purple-50/40 border border-purple-200/80 space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-xs">2</span>
                  <h2 className="text-xs font-black uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                    <Truck size={15} /> Scrap Business Accreditation
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Business / Trade Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Eco Scrap Traders"
                      value={dealerBusinessName}
                      onChange={(e) => setDealerBusinessName(e.target.value)}
                      className="block w-full px-3.5 py-3 bg-white border border-purple-200 rounded-xl text-sm text-gray-900 shadow-2xs focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Owner / Contact Person <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajesh Kumar"
                      value={dealerContactPerson}
                      onChange={(e) => setDealerContactPerson(e.target.value)}
                      className="block w-full px-3.5 py-3 bg-white border border-purple-200 rounded-xl text-sm text-gray-900 shadow-2xs focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Trade License / GSTIN / Business Registration <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GSTIN27ABCDE1234F1Z5 or REG-7734"
                    value={dealerRegNumber}
                    onChange={(e) => setDealerRegNumber(e.target.value)}
                    className="block w-full px-3.5 py-3 bg-white border border-purple-200 rounded-xl text-sm text-gray-900 shadow-2xs focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all font-mono"
                  />
                  <p className="mt-1 text-[11px] text-gray-500">
                    Administrator will verify your license credentials before approving pickup routing.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    Accepted Recyclable Materials <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {RECYCLING_CATEGORIES.map((cat) => {
                      const isSelected = acceptedMaterials.includes(cat.name);
                      return (
                        <button
                          key={cat.id || cat.name}
                          type="button"
                          onClick={() => handleMaterialToggle(cat.name)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                            isSelected
                              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {cat.name} {isSelected && '✓'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 2/3: Address & Location Details Card */}
            <div className="p-6 rounded-3xl bg-slate-50/60 border border-slate-200/70 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs">
                    {role === 'user' ? '2' : '3'}
                  </span>
                  <h2 className="text-xs font-black uppercase tracking-wider text-gray-700">
                    Location & Logistics
                  </h2>
                </div>

                <LiveLocationButton
                  label="Detect GPS Address"
                  color="green"
                  onLocationDetected={(data) => {
                    if (data.address) setAddress(data.address);
                    if (data.city) setCity(data.city);
                    if (data.state) setState(data.state);
                    if (data.pincode) setPincode(data.pincode);
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Street Address / Locality <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flat 4B, Green Towers, 12 MG Road"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 shadow-2xs focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="block w-full px-3.5 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 shadow-2xs focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">State</label>
                  <input
                    type="text"
                    placeholder="e.g. Maharashtra"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="block w-full px-3.5 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 shadow-2xs focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Pincode</label>
                  <input
                    type="text"
                    placeholder="e.g. 400001"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="block w-full px-3.5 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 shadow-2xs focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3/4: Account Security & Credentials Card */}
            <div className="p-6 rounded-3xl bg-slate-50/60 border border-slate-200/70 space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs">
                  {role === 'user' ? '3' : '4'}
                </span>
                <h2 className="text-xs font-black uppercase tracking-wider text-gray-700">
                  Account Security
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Create Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Create Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 shadow-2xs focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Password strength meter */}
                  {password && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-500">Security strength:</span>
                        <span className="font-bold text-emerald-700">{strengthLabels[passwordStrength]}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className={`h-full transition-all duration-300 ${
                              passwordStrength >= step ? strengthColors[passwordStrength] : 'bg-transparent'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 shadow-2xs focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 border border-transparent rounded-2xl shadow-lg shadow-emerald-600/25 text-base font-bold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all duration-200 flex items-center justify-center gap-2.5 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="small" color="white" />
                    <span>Creating Your Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account & Join Platform</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>

            {/* Back to Login link */}
            <div className="text-center pt-2">
              <p className="text-xs text-gray-500">
                Already registered with EcoDonate?{' '}
                <Link to="/login" className="font-bold text-emerald-600 hover:text-emerald-700 underline underline-offset-2">
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        )}

        {/* ===================================================================== */}
        {/* SCREEN 2: REGISTRATION SUCCESS (Individual Users / Donors) */}
        {/* ===================================================================== */}
        {currentStep === 'success' && (
          <div className="space-y-6 text-center animate-fadeIn py-4">
            <div className="inline-flex p-4 bg-emerald-50 rounded-3xl border border-emerald-200 text-emerald-600 shadow-xs">
              <CheckCircle2 size={52} className="text-emerald-600" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                Account Created & Active
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                Welcome to EcoDonate!
              </h2>
              <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                Thank you, <strong>{name}</strong>! Your account (<strong>{email}</strong>) has been successfully created and saved in the database.
              </p>
            </div>

            <div className="bg-slate-50 border border-gray-200 rounded-3xl p-6 text-left space-y-3 text-xs text-gray-600 max-w-lg mx-auto">
              <p className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">
                Your account is ready to use:
              </p>
              <ul className="space-y-2.5">
                <li className="flex items-center gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">✓</span>
                  <span>Donate clothes, books, and household goods to trusted NGOs</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">✓</span>
                  <span>Schedule doorstep recycling pickups with verified scrap dealers</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">✓</span>
                  <span>Earn EcoPoints and track your environmental contribution</span>
                </li>
              </ul>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
              >
                <span>Go to Dashboard</span>
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full py-3.5 px-6 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-2xl font-semibold text-sm transition-all"
              >
                Return to Home
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* SCREEN 3: PENDING ADMIN APPROVAL STATE (NGO & Scrap Dealers) */}
        {/* ===================================================================== */}
        {currentStep === 'pending' && (
          <div className="space-y-6 text-center animate-fadeIn py-4">
            <div className="inline-flex p-4 bg-amber-50 rounded-3xl border border-amber-200 text-amber-600 shadow-xs">
              <Clock size={48} className="animate-pulse" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                Status: Pending Admin Approval
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                Registration Submitted Successfully!
              </h2>
              <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                Thank you, <strong>{name}</strong>! Your registration details for <strong>{email}</strong> have been recorded in the database.
              </p>
            </div>

            <div className="bg-slate-50 border border-gray-200 rounded-3xl p-6 text-left space-y-3 max-w-lg mx-auto">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                What happens next?
              </h4>
              <ul className="text-xs text-gray-600 space-y-2.5">
                <li className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-[10px]">1</span>
                  <span>Our platform administrator will review your <strong>{role.toUpperCase()}</strong> registration details and license credentials.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-[10px]">2</span>
                  <span>Once verified, your account status will transition to <strong className="text-emerald-700">APPROVED</strong>.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-[10px]">3</span>
                  <span>You can then log in with your email and password to access the organization dashboard.</span>
                </li>
              </ul>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <button
                type="button"
                onClick={() => navigate(`/login?email=${encodeURIComponent(email)}`)}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
              >
                <span>Continue to Sign In Page</span>
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full py-3.5 px-6 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-2xl font-semibold text-sm transition-all"
              >
                Return to Home
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default RegisterPage;
