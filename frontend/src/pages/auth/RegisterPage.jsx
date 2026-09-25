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
  RefreshCw,
  AlertCircle,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';
import { RECYCLING_CATEGORIES } from '../../utils/constants';
import LiveLocationButton from '../../components/common/LiveLocationButton';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const RegisterPage = () => {
  // Steps: 'form' | 'otp' | 'pending'
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

  // OTP Verification State
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpExpiresIn, setOtpExpiresIn] = useState(600); // 10 minutes (600 seconds)

  // Loading & Error States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { registerRequest, verifyRegistrationOtp, resendRegistrationOtp } = useAuth();
  const navigate = useNavigate();

  // Resend cooldown timer
  useEffect(() => {
    let interval = null;
    if (resendCooldown > 0) {
      interval = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // OTP expiration countdown timer
  useEffect(() => {
    let interval = null;
    if (currentStep === 'otp' && otpExpiresIn > 0) {
      interval = setInterval(() => setOtpExpiresIn((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [currentStep, otpExpiresIn]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMaterialToggle = (material) => {
    setAcceptedMaterials((prev) =>
      prev.includes(material)
        ? prev.filter((m) => m !== material)
        : [...prev, material]
    );
  };

  // ============================================================================
  // Step 1: Handle Registration Form Submit -> Request Email OTP
  // ============================================================================
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
      setError('Passwords do not match. Please ensure both passwords match.');
      return;
    }

    // Role-specific validations
    if (role === 'ngo') {
      if (!ngoName.trim()) {
        setError('Please enter the NGO / Organization Name.');
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
        setError('Please enter the Dealer / Business Name.');
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
        setError('Please select at least one recyclable material that you accept.');
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
      toast.success(res.message || 'Verification code sent to your email!');
      setCurrentStep('otp');
      setResendCooldown(30);
      setOtpExpiresIn(600); // 10 minutes
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit registration. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // Step 2: Handle Verify Registration Email OTP
  // ============================================================================
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    const cleanOtp = otp.trim();
    if (!cleanOtp) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    if (cleanOtp.length !== 6) {
      setError('Verification code must be 6 digits.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await verifyRegistrationOtp(email.trim().toLowerCase(), cleanOtp);
      toast.success(res.message || 'Email verified successfully!');
      setCurrentStep('pending');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired verification code.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // Step 2 (Optional): Resend Email OTP
  // ============================================================================
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isSubmitting) return;
    setError('');
    setIsSubmitting(true);
    try {
      const res = await resendRegistrationOtp(email.trim().toLowerCase());
      toast.success(res.message || 'New verification code sent to your email!');
      setResendCooldown(30);
      setOtpExpiresIn(600);
      setOtp('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend code. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-gradient-to-b from-gray-50 to-green-50/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full bg-white p-7 sm:p-10 rounded-3xl shadow-xl border border-gray-100 transition-all">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-green-100/80 rounded-2xl border border-green-200 shadow-xs mb-3">
            <Leaf className="h-8 w-8 text-green-600 animate-pulse" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Create Your EcoDonate Account
          </h1>
          <p className="mt-1.5 text-sm text-gray-500">
            Join the movement giving waste a second life & powering circular community impact
          </p>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-3 animate-fadeIn">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div className="font-semibold leading-relaxed">{error}</div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* SCREEN 1: REGISTRATION FORM & ROLE SELECTION */}
        {/* ===================================================================== */}
        {currentStep === 'form' && (
          <form onSubmit={handleSubmitForm} className="space-y-6">
            
            {/* Role Question */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                What type of account do you want to create? <span className="text-red-500">*</span>
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. User */}
                <button
                  type="button"
                  onClick={() => { setRole('user'); setError(''); }}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    role === 'user'
                      ? 'border-green-600 bg-green-50/60 ring-2 ring-green-600/20 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-xl ${role === 'user' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                      <User size={20} />
                    </div>
                    {role === 'user' && <CheckCircle2 size={18} className="text-green-600" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">👤 User</h3>
                    <p className="text-xs text-gray-500 mt-1 leading-snug">
                      Donate items, schedule doorstep scrap pickup & track impact.
                    </p>
                  </div>
                </button>

                {/* 2. NGO */}
                <button
                  type="button"
                  onClick={() => { setRole('ngo'); setError(''); }}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    role === 'ngo'
                      ? 'border-green-600 bg-green-50/60 ring-2 ring-green-600/20 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-xl ${role === 'ngo' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                      <Building2 size={20} />
                    </div>
                    {role === 'ngo' && <CheckCircle2 size={18} className="text-green-600" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">🏢 NGO</h3>
                    <p className="text-xs text-gray-500 mt-1 leading-snug">
                      Receive community donations, clothes, food & distribute aid.
                    </p>
                  </div>
                </button>

                {/* 3. Scrap Dealer */}
                <button
                  type="button"
                  onClick={() => { setRole('scrapdealer'); setError(''); }}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    role === 'scrapdealer'
                      ? 'border-green-600 bg-green-50/60 ring-2 ring-green-600/20 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-xl ${role === 'scrapdealer' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                      <Truck size={20} />
                    </div>
                    {role === 'scrapdealer' && <CheckCircle2 size={18} className="text-green-600" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">♻️ Scrap Dealer</h3>
                    <p className="text-xs text-gray-500 mt-1 leading-snug">
                      Receive recycling orders, collect materials & drive circular loop.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Role Header Banner */}
            <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200/80 flex items-center justify-between text-xs text-gray-600">
              <span className="font-medium">
                Registering as: <strong className="text-gray-900 uppercase tracking-wide">{role === 'user' ? 'Individual User / Donor' : role === 'ngo' ? 'NGO / Organization' : 'Authorized Scrap Dealer'}</strong>
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                Verification Required
              </span>
            </div>

            {/* Dynamic Form Sections */}

            {/* SECTION A: General Personal / Contact Details */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                {role === 'user' ? 'Personal Information' : 'Organization & Contact Details'}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {role === 'user' ? 'Full Name' : 'Administrator / Account Contact Name'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                    <input
                      type="text"
                      required
                      placeholder={role === 'user' ? 'e.g. Rahul Sharma' : 'e.g. Suresh Patel'}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm shadow-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Email Address (For OTP Verification) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                    <input
                      type="email"
                      required
                      placeholder="e.g. rahul@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm shadow-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Mobile Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm shadow-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* SECTION B: Role-Specific Verification Details */}
            {role === 'ngo' && (
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 space-y-4">
                <h2 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 size={16} /> NGO Organization Details & Verification
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Official NGO Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Green Earth Foundation"
                      value={ngoName}
                      onChange={(e) => setNgoName(e.target.value)}
                      className="block w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Contact Person Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Suresh Patel"
                      value={ngoContactPerson}
                      onChange={(e) => setNgoContactPerson(e.target.value)}
                      className="block w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Registration / Trust / 80G Certificate Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NGO-REG-2024-9843"
                    value={ngoRegNumber}
                    onChange={(e) => setNgoRegNumber(e.target.value)}
                    className="block w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono"
                  />
                  <p className="mt-1 text-[11px] text-gray-500">
                    Administrator will verify this number before approving NGO application access.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Organization Mission / Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Briefly describe your NGO's social mission, causes supported, or community programs..."
                    value={ngoDescription}
                    onChange={(e) => setNgoDescription(e.target.value)}
                    className="block w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                  />
                </div>
              </div>
            )}

            {role === 'scrapdealer' && (
              <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-200/80 space-y-4">
                <h2 className="text-xs font-bold text-purple-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Truck size={16} /> Scrap Dealer Business & Verification Details
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Dealer / Business Trade Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Eco Scrap Traders"
                      value={dealerBusinessName}
                      onChange={(e) => setDealerBusinessName(e.target.value)}
                      className="block w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Owner / Contact Person Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajesh Kumar"
                      value={dealerContactPerson}
                      onChange={(e) => setDealerContactPerson(e.target.value)}
                      className="block w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Trade License / GST / Business Registration Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GSTIN27ABCDE1234F1Z5 or REG-7734"
                    value={dealerRegNumber}
                    onChange={(e) => setDealerRegNumber(e.target.value)}
                    className="block w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono"
                  />
                  <p className="mt-1 text-[11px] text-gray-500">
                    Administrator will review your business license before account activation.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    Accepted Recyclable Materials <span className="text-red-500">*</span>
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

            {/* SECTION C: Location & Address */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Address Details
                </h2>
                <LiveLocationButton
                  label="Detect My Location"
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
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 12 MG Road, Flat 4B"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm shadow-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="block w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm shadow-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    placeholder="e.g. Maharashtra"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="block w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm shadow-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    placeholder="e.g. 400001"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="block w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm shadow-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* SECTION D: Password Creation */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Account Security
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Create Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Create Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm shadow-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm shadow-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-2xl shadow-sm text-sm font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="small" color="white" />
                    <span>Sending Email Verification Code...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to Email Verification</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </div>

            {/* Back to Login link */}
            <div className="text-center pt-2">
              <p className="text-xs text-gray-500">
                Already registered with EcoDonate?{' '}
                <Link to="/login" className="font-bold text-green-600 hover:text-green-700 underline underline-offset-2">
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        )}

        {/* ===================================================================== */}
        {/* SCREEN 2: EMAIL OTP VERIFICATION */}
        {/* ===================================================================== */}
        {currentStep === 'otp' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center">
              <div className="inline-flex p-3 bg-blue-50 rounded-2xl border border-blue-200 mb-3 text-blue-600">
                <Mail size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Verify Your Email Address</h2>
              <p className="mt-1 text-xs text-gray-500">
                We've sent a 6-digit one-time code to:
              </p>
              <p className="mt-1 text-sm font-bold text-gray-800 bg-gray-100 py-1 px-3 rounded-lg inline-block font-mono">
                {email}
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 text-center mb-2">
                  Enter 6-Digit Verification Code
                </label>
                <div className="flex justify-center">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    placeholder="••••••"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-56 text-center text-2xl font-bold tracking-[8px] py-3 px-4 border border-gray-300 rounded-2xl shadow-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white font-mono"
                  />
                </div>
              </div>

              {/* Countdown & Resend */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-gray-50 p-3.5 rounded-2xl border border-gray-200/80">
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Clock size={15} className="text-amber-500" />
                  <span>
                    Code expires in: <strong className="text-gray-800 font-mono">{formatTimer(otpExpiresIn)}</strong>
                  </span>
                </div>

                <button
                  type="button"
                  disabled={resendCooldown > 0 || isSubmitting}
                  onClick={handleResendOtp}
                  className="font-bold text-green-600 hover:text-green-700 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-1 transition-all"
                >
                  <RefreshCw size={13} className={isSubmitting ? 'animate-spin' : ''} />
                  <span>{resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : 'Resend Code'}</span>
                </button>
              </div>

              {/* Verification Button */}
              <button
                type="submit"
                disabled={isSubmitting || otp.length !== 6}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-2xl shadow-sm text-sm font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="small" color="white" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    <span>Verify Email & Complete Registration</span>
                  </>
                )}
              </button>

              {/* Back to Edit Button */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setCurrentStep('form'); setError(''); }}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1 mx-auto"
                >
                  <ArrowLeft size={14} />
                  <span>Change email address or edit details</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ===================================================================== */}
        {/* SCREEN 3: PENDING ADMIN APPROVAL STATE */}
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
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                Registration Submitted Successfully!
              </h2>
              <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                Thank you, <strong>{name}</strong>! Your email address (<strong>{email}</strong>) has been verified.
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-left space-y-3">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                What happens next?
              </h4>
              <ul className="text-xs text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 text-green-700 font-bold flex items-center justify-center text-[10px]">1</span>
                  <span>Our platform administrator will review your <strong>{role.toUpperCase()}</strong> registration details and credentials.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 text-green-700 font-bold flex items-center justify-center text-[10px]">2</span>
                  <span>Upon successful review, your account status will transition from <strong className="text-amber-700">PENDING</strong> to <strong className="text-green-700">APPROVED</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 text-green-700 font-bold flex items-center justify-center text-[10px]">3</span>
                  <span>Once approved, you can sign in directly using your email and password to access all protected platform features.</span>
                </li>
              </ul>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="py-3 px-6 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <span>Continue to Sign In Page</span>
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="py-3 px-6 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-2xl font-semibold text-sm transition-all"
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
