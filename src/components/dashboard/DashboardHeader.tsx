import { useState, useEffect } from 'react';
import { Shield, MapPin, Loader2 } from 'lucide-react';
import logo from '@/assets/surakshapay-logo.png';

type LocationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'resolved'; city: string; state: string }
  | { status: 'denied' };

const DashboardHeader = () => {
  const [userName, setUserName] = useState('User');
  const [location, setLocation] = useState<LocationState>({ status: 'idle' });

  // Load user name from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('surakshapay_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.name) setUserName(parsed.name.split(' ')[0]);
      }
    } catch { /* fallback to 'User' */ }
  }, []);

  // Detect live location via browser Geolocation API
  useEffect(() => {
    if (!navigator.geolocation) return;

    setLocation({ status: 'loading' });

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        try {
          // Use OpenWeatherMap reverse geocoding to get city + state
          const apiKey = ''; // We call our backend which has the key
          // Try free reverse geocode via nominatim (no key needed)
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (!res.ok) throw new Error('Geocode failed');
          const data = await res.json();
          const addr = data.address || {};

          const city =
            addr.city || addr.town || addr.village || addr.county || 'Unknown';
          const state = addr.state || '';

          setLocation({ status: 'resolved', city, state });
        } catch {
          setLocation({ status: 'denied' });
        }
      },
      () => setLocation({ status: 'denied' }),
      { timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  return (
    <div className="px-5 pt-6 pb-4">
      <div className="flex items-center justify-between mb-4">
        <img src={logo} alt="SurakshaPay" className="h-8" />

        {/* Avatar + location marker */}
        <div className="flex flex-col items-center gap-1">
          <div className="relative">
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              {userName[0]}
            </div>
            {/* Pulsing dot indicator */}
            {location.status === 'resolved' && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-background rounded-full" />
            )}
          </div>

          {/* Location chip below avatar */}
          {location.status === 'loading' && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground animate-pulse">
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
              <span>Locating…</span>
            </div>
          )}
          {location.status === 'resolved' && (
            <div className="flex items-center gap-0.5 bg-secondary/10 border border-secondary/20 rounded-full px-2 py-0.5 shadow-sm">
              <MapPin className="w-2.5 h-2.5 text-secondary flex-shrink-0" />
              <span className="text-[10px] font-semibold text-secondary leading-tight">
                {location.city}
                {location.state ? `, ${location.state}` : ''}
              </span>
            </div>
          )}
          {location.status === 'denied' && (
            <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <MapPin className="w-2.5 h-2.5" />
              <span>Location off</span>
            </div>
          )}
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Hi {userName} 👋
        </h1>
        <div className="flex items-center gap-1.5 mt-1">
          <Shield className="w-4 h-4 text-secondary" />
          <span className="text-sm text-secondary font-medium">
            You're protected this week ✅
          </span>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
