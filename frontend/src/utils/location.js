/**
 * Live GPS Geolocation and Reverse Geocoding Utility
 */

export const getLiveGPSLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error('Geolocation is not supported by your browser.'));
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        try {
          // Reverse geocode using OpenStreetMap Nominatim API
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'en'
              }
            }
          );

          if (!response.ok) {
            throw new Error('Reverse geocoding network error');
          }

          const data = await response.json();
          const addr = data.address || {};

          // Extract best matching fields
          const city = 
            addr.city || 
            addr.town || 
            addr.village || 
            addr.suburb || 
            addr.county || 
            addr.state_district || 
            '';

          const state = addr.state || '';
          const pincode = addr.postcode || '';

          // Compose clean street address
          const streetParts = [
            addr.house_number,
            addr.building,
            addr.road || addr.street || addr.pedestrian,
            addr.neighbourhood || addr.suburb || addr.residential,
            addr.commercial
          ].filter(Boolean);

          const address = streetParts.length > 0 
            ? streetParts.join(', ') 
            : data.display_name?.split(',').slice(0, 3).join(', ') || `GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

          resolve({
            latitude,
            longitude,
            accuracy,
            address,
            city,
            state,
            pincode,
            displayName: data.display_name || address
          });
        } catch (geoError) {
          // Fallback if reverse geocode service is unreachable
          console.warn('Reverse geocoding failed, returning coordinates:', geoError.message);
          resolve({
            latitude,
            longitude,
            accuracy,
            address: `GPS Location (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`,
            city: '',
            state: '',
            pincode: '',
            displayName: `Lat: ${latitude.toFixed(5)}, Long: ${longitude.toFixed(5)}`
          });
        }
      },
      (error) => {
        let msg = 'Unable to retrieve location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = 'GPS permission was denied. Please allow location access in your browser.';
            break;
          case error.POSITION_UNAVAILABLE:
            msg = 'Location information is currently unavailable from your device GPS.';
            break;
          case error.TIMEOUT:
            msg = 'Location request timed out. Please try again.';
            break;
        }
        reject(new Error(msg));
      },
      options
    );
  });
};
