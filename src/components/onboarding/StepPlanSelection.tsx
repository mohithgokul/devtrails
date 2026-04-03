import { OnboardingData } from '@/hooks/useOnboarding';
import { plans } from '@/lib/mockData';
import { formatCurrency } from '@/utils/formatCurrency';
import { cn } from '@/lib/utils';
import { Check, Star } from 'lucide-react';

interface Props {
  data: OnboardingData;
  updateData: (d: Partial<OnboardingData>) => void;
}

const StepPlanSelection = ({ data, updateData }: Props) => {
  const estimatedPremium = Math.round(
    data.weeklyIncome * (plans.find(p => p.id === data.selectedPlan)?.premiumMultiplier || 0.06)
  );

  return (
    <div className="space-y-5 animate-slide-left">
      <div>
        <h2 className="text-xl font-bold text-foreground">Choose your plan</h2>
        <p className="text-sm text-muted-foreground mt-1">Select the coverage that fits your needs</p>
      </div>

      {/* Plan Cards */}
      <div className="space-y-3">
        {plans.map(plan => {
          const isSelected = data.selectedPlan === plan.id;
          return (
            <button
              key={plan.id}
              onClick={() => updateData({ selectedPlan: plan.id })}
              className={cn(
                'w-full text-left p-4 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden',
                isSelected
                  ? 'border-primary shadow-lg scale-[1.02]'
                  : 'border-border hover:border-primary/30'
              )}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 gradient-primary text-primary-foreground text-[10px] font-bold px-3 py-0.5 rounded-bl-xl flex items-center gap-1">
                  <Star className="w-3 h-3" /> Popular
                </div>
              )}
              {isSelected && (
                <div className="absolute inset-0 gradient-primary-soft" />
              )}
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-foreground">{plan.name}</h3>
                    <span className="text-2xl font-bold text-gradient-primary">{plan.coverage}%</span>
                    <span className="text-xs text-muted-foreground ml-1">coverage</span>
                  </div>
                  <div className={cn(
                    'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                    isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                  )}>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {plan.features.map(f => (
                    <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Weekly Income Slider */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-foreground">Expected weekly income</label>
          <span className="text-sm font-bold text-primary">{formatCurrency(data.weeklyIncome)}</span>
        </div>
        <input
          type="range"
          min={1000}
          max={15000}
          step={500}
          value={data.weeklyIncome}
          onChange={(e) => updateData({ weeklyIncome: Number(e.target.value) })}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, hsl(217 91% 53%) ${((data.weeklyIncome - 1000) / 14000) * 100}%, hsl(210 40% 96%) ${((data.weeklyIncome - 1000) / 14000) * 100}%)`
          }}
        />
      </div>

      {/* Premium Preview */}
      <div className="glass-card-strong rounded-2xl p-4 text-center">
        <p className="text-xs text-muted-foreground mb-1">Estimated Weekly Premium</p>
        <p className="text-3xl font-bold text-gradient-primary">{formatCurrency(estimatedPremium)}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Auto-deducted every Monday · Cancel anytime
        </p>
      </div>
    </div>
  );
};

export default StepPlanSelection;
