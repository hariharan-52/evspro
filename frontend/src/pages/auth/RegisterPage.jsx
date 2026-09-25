import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Building2,
  Truck,
  Leaf,
  Smartphone,
  KeyRound,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';
import { RECYCLING_CATEGORIES } from '../../utils/constants';
import LiveLocationButton from '../../components/common/LiveLocationButton';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const RegisterPage = () => {
  const [role, setRole] = useState('user');
  const [regMethod, setRegMethod] = useState('otp'); // 'otp' | 'password'

  // Form Fields
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState(''); // phone or email
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Location fields
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  // NGO & Dealer specifics
  const [contactPerson, setContactPerson] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [description, setDescription] = useState('');
  const [acceptedMaterials, setAcceptedMaterials] = useState(['Plastic', 'Paper', 'Metal']);

  // OTP Verification Step
  const [otpStep, setOtpStep] = useState('input'); // 'input' | 'verify'
  const [enteredOtp, setEnteredOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { register, sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();

  const handleMaterialToggle = (material) => {
    setAcceptedMaterials(prev =>
      prev.includes(material)
        ? prev.filter(m => m !== material)
        : [...prev, material]
    );
  };

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setError('');

    const targetId = identifier.trim() || phone.trim() || email.trim();
    if (!name.trim()) {
      setError('Please enter your full name or organization name.');
      return;
    }
    if (!targetId) {
      setError('Please provide your mobile number or email address for verification.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await sendOtp(targetId);
      if (res.otp) {
        setGeneratedOtp(res.otp);
      }
      setOtpStep('verify');
      setResendTimer(30);
      toast.success('Verification code generated!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyAndRegister = async (e) => {
    e?.preventDefault();
    setError('');

    const cleanOtp = enteredOtp.trim();
    if (!cleanOtp) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const targetId = identifier.trim() || phone.trim() || email.trim();
      const isEmail = targetId.includes('@');

      const payload = {
        identifier: targetId,
        otp: cleanOtp,
        name: name.trim(),
        role,
        phone: isEmail ? (phone.trim() || '') : targetId,
        email: isEmail ? targetId.toLowerCase() : (email.trim().toLowerCase() || `${targetId}@ecodonate.local`),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
      };

      if (role === 'ngo') {
        payload.ngo_name = name.trim();
        payload.contact_person = contactPerson.trim() || name.trim();
        payload.registration_number = registrationNumber.trim();
        payload.description = description.trim();
      } else if (role === 'scrapdealer') {
        payload.business_name = name.trim();
        payload.contact_person = contactPerson.trim() || name.trim();
        payload.registration_number = registrationNumber.trim();
        payload.accepted_materials = acceptedMaterials;
      }

      const res = await verifyOtp(payload);

      if (res.user) {
        toast.success(`Welcome to EcoDonate, ${name}!`);
        if (role === 'ngo') navigate('/ngo/dashboard', { replace: true });
        else if (role === 'scrapdealer') navigate('/dealer/dashboard', { replace: true });
        else navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please provide your name.');
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setError('Please provide either an email or mobile phone number.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase() || `${phone.trim()}@ecodonate.local`,
        phone: phone.trim(),
        password,
        role,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
      };

      if (role === 'ngo') {
        payload.ngo_name = name.trim();
        payload.contact_person = contactPerson.trim() || name.trim();
        payload.registration_number = registrationNumber.trim();
        payload.description = description.trim();
      } else if (role === 'scrapdealer') {
        payload.business_name = name.trim();
        payload.contact_person = contactPerson.trim() || name.trim();
        payload.registration_number = registrationNumber.trim();
        payload.accepted_materials = acceptedMaterials;
      }

      await register(payload);

      toast.success(`Registration successful! Welcome to EcoDonate.`);
      if (role === 'ngo') navigate('/ngo/dashboard', { replace: true });
      else if (role === 'scrapdealer') navigate('/dealer/dashboard', { replace: true });
      else navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-green-50/40 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6 bg-white p-6 sm:p-9 rounded-3xl shadow-xl border border-gray-100">
        
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex p-3 bg-green-100/70 rounded-2xl border border-green-200 shadow-xs mb-2">
            <Leaf className="h-10 w-10 text-green-600 animate-pulse" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Create your EcoDonate Account</h2>
          <p className="mt-1 text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-green-600 hover:text-green-700 hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        {/* Role Selector Cards */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">
            1. Select Your Role
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setRole('user')}
              className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                role === 'user'
                  ? 'border-green-600 bg-green-50/80 shadow-xs ring-2 ring-green-600/20'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`p-2 rounded-xl ${role === 'user' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  <User size={18} />
                </span>
                {role === 'user' && <CheckCircle2 size={16} className="text-green-600" />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900">Donor / Citizen</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">Donate items & recycle waste</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRole('ngo')}
              className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                role === 'ngo'
                  ? 'border-blue-600 bg-blue-50/80 shadow-xs ring-2 ring-blue-600/20'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`p-2 rounded-xl ${role === 'ngo' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  <Building2 size={18} />
                </span>
                {role === 'ngo' && <CheckCircle2 size={16} className="text-blue-600" />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900">NGO Foundation</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">Claim & distribute aid</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRole('scrapdealer')}
              className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                role === 'scrapdealer'
                  ? 'border-amber-600 bg-amber-50/80 shadow-xs ring-2 ring-amber-600/20'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`p-2 rounded-xl ${role === 'scrapdealer' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  <Truck size={18} />
                </span>
                {role === 'scrapdealer' && <CheckCircle2 size={16} className="text-amber-600" />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900">Scrap Dealer</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">Collect & process recyclables</p>
              </div>
            </button>
          </div>
        </div>

        {/* Verification Method Toggle */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">
            2. Choose Verification Method
          </label>
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-gray-100 rounded-2xl border border-gray-200/80">
            <button
              type="button"
              onClick={() => { setRegMethod('otp'); setOtpStep('input'); setError(''); }}
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                regMethod === 'otp'
                  ? 'bg-white text-green-700 shadow-sm border border-gray-200/50'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Smartphone size={15} />
              <span>Instant OTP Code (Fast)</span>
            </button>

            <button
              type="button"
              onClick={() => { setRegMethod('password'); setError(''); }}
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                regMethod === 'password'
                  ? 'bg-white text-green-700 shadow-sm border border-gray-200/50'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <KeyRound size={15} />
              <span>Password Sign Up</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
            <AlertCircle size={17} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="font-semibold leading-relaxed">{error}</p>
          </div>
        )}

        {/* ================================================================= */}
        {/* OTP REGISTRATION FLOW */}
        {/* ================================================================= */}
        {regMethod === 'otp' && (
          <div className="space-y-4">
            {otpStep === 'input' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {role === 'user' ? 'Full Name' : role === 'ngo' ? 'NGO Name' : 'Business / Scrap Dealer Name'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar or Green Earth NGO"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Mobile Phone Number or Email
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 9876543211 or user@example.com"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 bg-white"
                    />
                  </div>

                  {(role === 'ngo' || role === 'scrapdealer') && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-gray-700 mb-1">Contact Person</label>
                      <input
                        type="text"
                        placeholder="Authorized contact person"
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm bg-white"
                      />
                    </div>
                  )}

                  {role === 'scrapdealer' && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-gray-700 mb-2">Accepted Waste Materials</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {RECYCLING_CATEGORIES.map(cat => (
                          <label key={cat} className="flex items-center space-x-2 text-xs text-gray-700">
                            <input
                              type="checkbox"
                              checked={acceptedMaterials.includes(cat)}
                              onChange={() => handleMaterialToggle(cat)}
                              className="rounded text-green-600 focus:ring-green-500"
                            />
                            <span>{cat}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-green-600 hover:bg-green-700 shadow-md transition-all focus:ring-2 focus:ring-green-500 disabled:opacity-70"
                >
                  {isSubmitting ? <LoadingSpinner size="small" className="text-white" /> : 'Get Instant Verification Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyAndRegister} className="space-y-4 animate-fadeIn">
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-gray-500">Verifying: </span>
                    <span className="font-bold text-gray-900">{name} ({identifier})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setOtpStep('input'); setEnteredOtp(''); }}
                    className="text-green-600 font-bold underline"
                  >
                    Edit
                  </button>
                </div>

                {generatedOtp && (
                  <div
                    onClick={() => setEnteredOtp(generatedOtp)}
                    className="cursor-pointer p-3 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs text-emerald-900 hover:bg-emerald-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-emerald-600" />
                      <span>Security Code: <strong className="text-emerald-800 tracking-wider text-sm">{generatedOtp}</strong></span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-lg border border-emerald-200">
                      Tap to auto-fill
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Enter 6-Digit Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="• • • • • •"
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-xl text-center text-xl font-bold tracking-widest text-gray-900 focus:ring-2 focus:ring-green-500 bg-white"
                    autoFocus
                  />
                </div>

                {/* Optional Location */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Add Location (Optional)</h4>
                    <p className="text-[11px] text-gray-500">Auto-fill via GPS or skip for now</p>
                  </div>
                  <LiveLocationButton
                    color="green"
                    label="Share GPS"
                    onLocationDetected={(loc) => {
                      setAddress(loc.address || address);
                      setCity(loc.city || city);
                      setState(loc.state || state);
                      setPincode(loc.pincode || pincode);
                    }}
                  />
                </div>

                {address && (
                  <div className="p-3 bg-green-50 rounded-xl text-xs text-green-900 border border-green-200">
                    📍 {address}, {city} {pincode}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || enteredOtp.length < 6}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-green-600 hover:bg-green-700 shadow-md transition-all focus:ring-2 focus:ring-green-500 disabled:opacity-60"
                >
                  {isSubmitting ? <LoadingSpinner size="small" className="text-white" /> : 'Complete Registration & Open Dashboard'}
                </button>

                <div className="text-center pt-1">
                  {resendTimer > 0 ? (
                    <span className="text-xs text-gray-400">Resend code in {resendTimer}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="text-xs font-bold text-green-600 hover:text-green-700 inline-flex items-center gap-1"
                    >
                      <RefreshCw size={12} /> Resend verification code
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* PASSWORD REGISTRATION FLOW */}
        {/* ================================================================= */}
        {regMethod === 'password' && (
          <form onSubmit={handlePasswordRegister} className="space-y-4 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {role === 'user' ? 'Full Name' : role === 'ngo' ? 'NGO Organization Name' : 'Business Name'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm bg-white"
                />
              </div>

              {(role === 'ngo' || role === 'scrapdealer') && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="Authorized representative name"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm bg-white"
                  />
                </div>
              )}

              {/* Location */}
              <div className="sm:col-span-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Location & Address</h4>
                  <p className="text-[11px] text-gray-500">Auto-fill with device GPS</p>
                </div>
                <LiveLocationButton
                  color="green"
                  label="Share Live Location"
                  onLocationDetected={(loc) => {
                    setAddress(loc.address || address);
                    setCity(loc.city || city);
                    setState(loc.state || state);
                    setPincode(loc.pincode || pincode);
                  }}
                />
              </div>

              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="Street Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl text-xs bg-white"
                />
              </div>

              <div>
                <input
                  type="text"
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl text-xs bg-white"
                />
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-green-600 hover:bg-green-700 shadow-md transition-all focus:ring-2 focus:ring-green-500 disabled:opacity-70"
            >
              {isSubmitting ? <LoadingSpinner size="small" className="text-white" /> : 'Create Account'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default RegisterPage;
