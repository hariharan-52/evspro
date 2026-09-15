import React, { useState } from 'react';
import { MapPin, Navigation, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { getLiveGPSLocation } from '../../utils/location';
import { toast } from 'react-hot-toast';

const LiveLocationButton = ({ 
  onLocationDetected, 
  color = 'green',
  label = 'Share Live GPS Location',
  className = ''
}) => {
  const [locating, setLocating] = useState(false);
  const [lastDetected, setLastDetected] = useState(null);

  const colorStyles = {
    green: {
      btn: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-300 hover:border-green-400 focus:ring-green-500',
      badge: 'bg-green-100/80 text-green-800 border-green-300',
      icon: 'text-green-600'
    },
    teal: {
      btn: 'bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-300 hover:border-teal-400 focus:ring-teal-500',
      badge: 'bg-teal-100/80 text-teal-800 border-teal-300',
      icon: 'text-teal-600'
    },
    blue: {
      btn: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300 hover:border-blue-400 focus:ring-blue-500',
      badge: 'bg-blue-100/80 text-blue-800 border-blue-300',
      icon: 'text-blue-600'
    },
    purple: {
      btn: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-300 hover:border-purple-400 focus:ring-purple-500',
      badge: 'bg-purple-100/80 text-purple-800 border-purple-300',
      icon: 'text-purple-600'
    }
  };

  const theme = colorStyles[color] || colorStyles.green;

  const handleGetLocation = async (e) => {
    e?.preventDefault();
    setLocating(true);

    try {
      toast.loading('Accessing device GPS & locating address...', { id: 'gps-loc' });
      const loc = await getLiveGPSLocation();
      setLastDetected(loc);

      if (onLocationDetected) {
        onLocationDetected(loc);
      }

      toast.success(
        `Location detected: ${loc.city ? loc.city + ', ' : ''}${loc.pincode || loc.address.slice(0, 25)}`, 
        { id: 'gps-loc', duration: 4000 }
      );
    } catch (err) {
      toast.error(err.message || 'Could not fetch GPS location', { id: 'gps-loc' });
    } finally {
      setLocating(false);
    }
  };

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={handleGetLocation}
        disabled={locating}
        className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg border text-xs font-bold transition-all shadow-xs disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-offset-1 ${theme.btn}`}
        title="Click to automatically fill address using device GPS"
      >
        {locating ? (
          <>
            <Loader2 size={15} className="animate-spin text-current" />
            <span>Locating via GPS...</span>
          </>
        ) : (
          <>
            <Navigation size={15} className={`${theme.icon} animate-pulse`} />
            <span>{label}</span>
          </>
        )}
      </button>

      {lastDetected && (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${theme.badge}`}>
          <CheckCircle2 size={13} className="text-current" />
          <span className="truncate max-w-[240px]">
            GPS: {lastDetected.city || 'Located'} {lastDetected.pincode ? `(${lastDetected.pincode})` : ''}
          </span>
        </span>
      )}
    </div>
  );
};

export default LiveLocationButton;
