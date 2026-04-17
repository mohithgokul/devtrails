import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import GlassCard from '@/components/layout/GlassCard';
import { CloudRain, Wind, AlertTriangle, ShieldAlert, Loader2, Send, CheckCircle2, Banknote, Zap } from 'lucide-react';
import { mockClaims } from '@/lib/mockData';

const DEMO_USER_ID = 1;

interface PayoutModal {
  amount: number;
  payout_id: string;
  mode: string;
  claim_id: number;
  fraud_decision: string;
}

export default function FileClaim() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [triggerType, setTriggerType] = useState('heavy_rain');
  const [hoursLost, setHoursLost] = useState('4');
  const [isSpoofing, setIsSpoofing] = useState(false);
  const [payoutModal, setPayoutModal] = useState<PayoutModal | null>(null);

  const [gpsLat, setGpsLat] = useState('12.9716');
  const [gpsLon, setGpsLon] = useState('77.5946');

  const triggerOptions = [
    { id: 'heavy_rain', label: 'Heavy Rain', icon: CloudRain, emoji: '🌧️' },
    { id: 'high_aqi', label: 'Severe Pollution', icon: Wind, emoji: '🌫️' },
    { id: 'curfew', label: 'Curfew / Shutdown', icon: AlertTriangle, emoji: '🚨' },
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
      claimed_rain: 0,
      claimed_aqi: 0,
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
        triggerIcon: triggerOptions.find(t => t.id === triggerType)?.emoji || '⚠️',
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

      // Show payout modal if claim was approved and payout was processed
      const payout = data.payout_result;
      if (data.status === 'approved' && payout && payout.razorpay_payout_id) {
        setPayoutModal({
          amount: payout.amount_inr || data.payout_amount,
          payout_id: payout.razorpay_payout_id,
          mode: payout.payment_mode || 'UPI',
          claim_id: data.claim_id,
          fraud_decision: data.fraud_decision,
        });
      } else {
        navigate(`/claims/CLM-${data.claim_id}`);
      }

    } catch (err) {
      console.error(err);
      alert('Failed to submit claim. Make sure the backend is running!');
    } finally {
      setLoading(false);
    }
  };

  // ── Payout Success Modal ──────────────────────────────────────────────────
  if (payoutModal) {
    return (
      <AppLayout>
        <div className="px-5 pt-10 pb-20 flex flex-col items-center justify-center min-h-[80vh]">
          <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mb-5 animate-bounce">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>

          <h1 className="text-2xl font-bold text-green-400 mb-1 text-center">Payment Sent!</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Your disruption claim was approved and your payout has been instantly processed.
          </p>

          <div className="w-full max-w-sm bg-green-500/10 border border-green-500/30 rounded-2xl p-5 mb-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Banknote className="w-5 h-5 text-green-400" />
              <span className="text-xs text-green-300 font-medium uppercase tracking-wider">Amount Transferred</span>
            </div>
            <p className="text-4xl font-black text-green-300 mb-1">&#8377;{payoutModal.amount.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">via {payoutModal.mode}</p>
          </div>

          <GlassCard className="w-full max-w-sm space-y-3 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-semibold text-foreground">Transaction Details</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Claim ID</span>
              <span className="text-foreground font-mono">CLM-{payoutModal.claim_id}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Razorpay Txn ID</span>
              <span className="text-foreground font-mono text-[10px] break-all text-right max-w-[55%]">{payoutModal.payout_id}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Fraud Verdict</span>
              <span className="text-green-400 font-semibold">{payoutModal.fraud_decision}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Status</span>
              <span className="text-green-400 font-semibold">&#9679; Processed</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Payment Mode</span>
              <span className="text-foreground">{payoutModal.mode}</span>
            </div>
          </GlassCard>

          <button
            onClick={() => navigate(`/claims/CLM-${payoutModal.claim_id}`)}
            className="w-full max-w-sm py-3.5 rounded-xl text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition-all"
          >
            View Claim Details
          </button>
        </div>
      </AppLayout>
    );
  }

  // ── Main Form ─────────────────────────────────────────────────────────────
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
              Our system will securely fetch authenticated weather sensor APIs for your location.
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
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing &amp; Processing Payout...
              </>
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
