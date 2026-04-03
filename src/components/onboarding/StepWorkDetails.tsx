import { OnboardingData } from '@/hooks/useOnboarding';
import { platforms } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/formatCurrency';

interface Props {
  data: OnboardingData;
  updateData: (d: Partial<OnboardingData>) => void;
}

const StepWorkDetails = ({ data, updateData }: Props) => {
  const togglePlatform = (id: string) => {
    const updated = data.platforms.includes(id)
      ? data.platforms.filter(p => p !== id)
      : [...data.platforms, id];
    updateData({ platforms: updated });
  };

  return (
    <div className="space-y-5 animate-slide-left">
      <div>
        <h2 className="text-xl font-bold text-foreground">Your work details</h2>
        <p className="text-sm text-muted-foreground mt-1">Help us understand your delivery routine</p>
      </div>

      {/* Platform Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Which platforms do you deliver for?</label>
        <div className="grid grid-cols-3 gap-2">
          {platforms.map(p => (
            <button
              key={p.id}
              onClick={() => togglePlatform(p.id)}
              className={cn(
                'flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all duration-200',
                data.platforms.includes(p.id)
                  ? 'border-primary bg-primary/5 scale-105 shadow-sm'
                  : 'border-border bg-muted/30 hover:border-primary/30'
              )}
            >
              <span className="text-2xl">{p.icon}</span>
              <span className="text-xs font-medium">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Work Hours Slider */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-foreground">Daily work hours</label>
          <span className="text-sm font-bold text-primary">{data.workHours}h</span>
        </div>
        <input
          type="range"
          min={1}
          max={16}
          value={data.workHours}
          onChange={(e) => updateData({ workHours: Number(e.target.value) })}
          className="w-full h-2 rounded-full appearance-none bg-muted accent-primary cursor-pointer"
          style={{
            background: `linear-gradient(to right, hsl(217 91% 53%) ${(data.workHours / 16) * 100}%, hsl(210 40% 96%) ${(data.workHours / 16) * 100}%)`
          }}
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>1 hr</span>
          <span>16 hrs</span>
        </div>
      </div>

      {/* Daily Earnings */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-foreground">Average daily earnings</label>
          <span className="text-sm font-bold text-secondary">{formatCurrency(data.dailyEarnings)}</span>
        </div>
        <input
          type="range"
          min={200}
          max={2000}
          step={50}
          value={data.dailyEarnings}
          onChange={(e) => updateData({ dailyEarnings: Number(e.target.value) })}
          className="w-full h-2 rounded-full appearance-none bg-muted cursor-pointer"
          style={{
            background: `linear-gradient(to right, hsl(142 71% 45%) ${((data.dailyEarnings - 200) / 1800) * 100}%, hsl(210 40% 96%) ${((data.dailyEarnings - 200) / 1800) * 100}%)`
          }}
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>₹200</span>
          <span>₹2,000</span>
        </div>
      </div>
    </div>
  );
};

export default StepWorkDetails;
