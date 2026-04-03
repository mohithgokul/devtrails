import { useState, useEffect, useRef } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import GlassCard from '@/components/layout/GlassCard';
import { plans } from '@/lib/mockData';
import { formatCurrency } from '@/utils/formatCurrency';
import { cn } from '@/lib/utils';
import { Check, Star, TrendingDown } from 'lucide-react';

const PremiumCalc = () => {
  const [income, setIncome] = useState(5000);
  const [hours, setHours] = useState(8);
  const [riskLevel, setRiskLevel] = useState(35);
  const [selectedPlan, setSelectedPlan] = useState('standard');
  const [displayPremium, setDisplayPremium] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const expectedLossLocal = Math.round(income * (riskLevel / 100) * 0.3);
  const disruption = Math.round(riskLevel * 0.8);

  // Fetch backend calculation
  useEffect(() => {
    const fetchPremium = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/calculate_premium`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: 'Calculator',
            phone: '0000000000',
            workHours: hours,
            dailyEarnings: income / 5, // Approximate daily earnings
            selectedPlan: selectedPlan
          })
        });
        if (res.ok) {
          const data = await res.json();
          // We can use the returned premium to animate
          // But for now, we just set the target premium
          setDisplayPremium(data.premium);
        }
      } catch (e) {
        console.error(e);
      }
    };
    
    const timeoutId = setTimeout(() => {
      fetchPremium();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [income, hours, selectedPlan, riskLevel]);


  const savings = Math.max(0, Math.round(income * 0.08 - displayPremium));

  return (
    <AppLayout>
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-foreground mb-1">Premium Calculator</h1>
        <p className="text-sm text-muted-foreground mb-6">See how your premium is calculated</p>

        {/* Sliders */}
        <div className="space-y-5 mb-6">
          {[
            { label: 'Weekly Income', value: income, set: setIncome, min: 1000, max: 15000, step: 500, display: formatCurrency(income), color: 'hsl(217 91% 53%)' },
            { label: 'Daily Work Hours', value: hours, set: setHours, min: 2, max: 16, step: 1, display: `${hours}h`, color: 'hsl(142 71% 45%)' },
            { label: 'Risk Level', value: riskLevel, set: setRiskLevel, min: 10, max: 90, step: 5, display: `${riskLevel}%`, color: 'hsl(45 93% 58%)' },
          ].map(s => (
            <div key={s.label} className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-foreground">{s.label}</label>
                <span className="text-sm font-bold" style={{ color: s.color }}>{s.display}</span>
              </div>
              <input
                type="range" min={s.min} max={s.max} step={s.step} value={s.value}
                onChange={e => s.set(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${s.color} ${((s.value - s.min) / (s.max - s.min)) * 100}%, hsl(210 40% 96%) ${((s.value - s.min) / (s.max - s.min)) * 100}%)`
                }}
              />
            </div>
          ))}
        </div>

        {/* Live Calculation */}
        <GlassCard variant="gradient" className="mb-6 animate-fade-in-up">
          <div className="text-center">
            <p className="text-xs text-primary-foreground/80 mb-1">Your Weekly Premium</p>
            <p className="text-4xl font-bold text-primary-foreground">{formatCurrency(displayPremium)}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-primary-foreground/20">
            <div className="text-center">
              <p className="text-lg font-bold text-primary-foreground">{formatCurrency(expectedLossLocal)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-primary-foreground/70">Disruption Prob.</p>
              <p className="text-lg font-bold text-primary-foreground">{disruption}%</p>
            </div>
          </div>
        </GlassCard>

        {savings > 0 && (
          <div className="flex items-center gap-2 mb-6 p-3 rounded-xl bg-secondary/10 border border-secondary/30 animate-fade-in-up">
            <TrendingDown className="w-4 h-4 text-secondary" />
            <p className="text-xs text-secondary font-medium">You save {formatCurrency(savings)} with your low risk score!</p>
          </div>
        )}

        {/* Plan Comparison */}
        <h2 className="text-sm font-semibold text-foreground mb-3">Compare Plans</h2>
        <div className="space-y-3">
          {plans.map(p => {
            const isSelected = selectedPlan === p.id;
            const riskMultiplier = 1 + (riskLevel - 30) * 0.005;
            const hoursMultiplier = hours > 10 ? 1.15 : hours < 5 ? 0.85 : 1;
            const planPremium = Math.round(income * p.premiumMultiplier * riskMultiplier * hoursMultiplier);
            const payout = Math.round(income * p.coverage / 100);
            return (
              <GlassCard
                key={p.id}
                onClick={() => setSelectedPlan(p.id)}
                className={cn(
                  'relative overflow-hidden transition-all duration-300',
                  isSelected && 'ring-2 ring-primary shadow-lg animate-pulse-glow'
                )}
              >
                {p.popular && (
                  <div className="absolute top-0 right-0 gradient-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-bl-xl flex items-center gap-0.5">
                    <Star className="w-3 h-3" /> Popular
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.coverage}% coverage</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground">payout up to {formatCurrency(payout)}</p>
                  </div>
                  <div className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center ml-2',
                    isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                  )}>
                    {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
};

export default PremiumCalc;
