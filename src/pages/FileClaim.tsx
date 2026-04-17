import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import GlassCard from '@/components/layout/GlassCard';
import { CloudRain, Wind, AlertTriangle, ShieldAlert, Loader2, Send } from 'lucide-react';
import { mockClaims } from '@/lib/mockData';

const DEMO_USER_ID = 1;

export default function FileClaim() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [triggerType, setTriggerType] = useState('heavy_rain');
  const [hoursLost, setHoursLost] = useState('4');
  
  // Hidden coordinates
  const [gpsLat, setGpsLat] = useState('12.9716');
  const [gpsLon, setGpsLon] = useState('77.5946');
  
  // Developer test flag
  const [isSpoofing, setIsSpoofing] = useState(false);

  const triggerOptions = [
    { id: 'heavy_rain', label: 'Heavy Rain', icon: CloudRain },
    { id: 'high_aqi', label: 'Severe Pollution', icon: Wind },
    { id: 'curfew', label: 'Curfew / Shutdown', icon: AlertTriangle },
  ];

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLat(pos.coords.latitude.toFixed(4));
          setGpsLon(pos.coords.longitude.toFixed(4));
        },
        (err) => console.log('Geolocation error:', err),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      user_id: DEMO_USER_ID,
      trigger_type: triggerType,
      description: `Disruption period: ${hoursLost} hours.`,
      gps_lat: parseFloat(gpsLat),
      gps_lon: parseFloat(gpsLon),
      cell_tower_lat: isSpoofing ? 28.7041 : parseFloat(gpsLat),
      cell_tower_lon: isSpoofing ? 77.1025 : parseFloat(gpsLon),
      location_change_speed_kmph: 0,
      claimed_rain: 0, // Backend computes actuals
      claimed_aqi: 0,  // Backend computes actuals
      orders_completed_that_day: 0,
      avg_daily_orders_last_week: 5.5
    };

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/claims/file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to file claim');
      }

      const newMockClaim = {
        id: `CLM-${data.claim_id}`,
        trigger: triggerOptions.find(t => t.id === triggerType)?.label || triggerType,
        triggerIcon: triggerOptions.find(t => t.id === triggerType)?.id === 'heavy_rain' ? '🌧️' : '⚠️',
        date: new Date().toISOString().split('T')[0],
        status: data.status,
        amount: data.payout_amount,
        activityValidated: data.fraud_decision === 'APPROVED',
        coverageApplied: 70,
        lossCalculated: data.payout_amount * 1.4,
        fraud_score: data.fraud_score,
        trust_score: data.trust_score,
        fraud_decision: data.fraud_decision,
        fraud_type_suspected: data.fraud_type_suspected,
        fraud_flags: data.flags,
      };

      mockClaims.unshift(newMockClaim);
      navigate(`/claims/CLM-${data.claim_id}`);

    } catch (err) {
      console.error(err);
      alert('Failed to submit claim. Make sure the backend is running on port 8000!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="px-5 pt-6 pb-20">
        <h1 className="text-2xl font-bold text-foreground mb-1">File a Claim</h1>
        <p className="text-sm text-muted-foreground mb-6">Immediate assessment via smart contracts.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <GlassCard>
            <h2 className="text-sm font-semibold mb-3">1. Select Disruption Cause</h2>
            <div className="grid grid-cols-1 gap-2">
              {triggerOptions.map(t => {
                const Icon = t.icon;
                const active = triggerType === t.id;
                return (
                  <label key={t.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    active ? 'border-primary bg-primary/10' : 'border-border bg-white/5'
                  }`}>
                    <input type="radio" className="hidden" name="trigger" value={t.id} 
                           checked={active} onChange={() => setTriggerType(t.id)} />
                    <Icon className={`w-5 h-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-sm font-medium ${active ? 'text-primary' : 'text-foreground'}`}>{t.label}</span>
                  </label>
                );
              })}
            </div>
          </GlassCard>

          <GlassCard className="animate-fade-in-up">
            <h2 className="text-sm font-semibold mb-3">2. Time Period Lost</h2>
            <div className="mb-4">
              <label className="text-xs text-muted-foreground mb-1 block">Hours of work lost</label>
              <input 
                type="number" 
                value={hoursLost} onChange={(e) => setHoursLost(e.target.value)}
                placeholder="e.g. 4"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
                required
              />
            </div>
            
            <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Note:</strong> You do not need to provide proof of weather or location. 
              Our system will securely fetch the authenticated weather sensors API for your location in the background.
            </p>
          </GlassCard>

          <GlassCard className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <h2 className="text-sm font-semibold mb-2 text-rose-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> Demo: Test Fraud System
            </h2>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input 
                type="checkbox" 
                checked={isSpoofing} 
                onChange={(e) => setIsSpoofing(e.target.checked)} 
                className="rounded bg-black/50 border-white/20"
              />
              Simulate a Location Spoofing attack (sends fake coordinates)
            </label>
          </GlassCard>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full relative py-3.5 mt-2 rounded-xl text-sm font-bold text-primary-foreground shadow-lg transition-all overflow-hidden bg-primary/90 hover:bg-primary disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" /> Finalize Claim
              </>
            )}
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
