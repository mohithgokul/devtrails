import { OnboardingData } from '@/hooks/useOnboarding';
import { workConditions, workZones } from '@/lib/mockData';
import { cn } from '@/lib/utils';

interface Props {
  data: OnboardingData;
  updateData: (d: Partial<OnboardingData>) => void;
}

const peakOptions = [
  { id: 'morning', label: '6AM–12PM', icon: '🌅' },
  { id: 'afternoon', label: '12PM–6PM', icon: '☀️' },
  { id: 'evening', label: '6PM–12AM', icon: '🌆' },
  { id: 'night', label: '12AM–6AM', icon: '🌙' },
];

const StepRiskProfile = ({ data, updateData }: Props) => {
  const toggleZone = (zone: string) => {
    const updated = data.workZones.includes(zone)
      ? data.workZones.filter(z => z !== zone)
      : [...data.workZones, zone];
    updateData({ workZones: updated });
  };

  const toggleCondition = (id: string) => {
    const updated = data.workConditions.includes(id)
      ? data.workConditions.filter(c => c !== id)
      : [...data.workConditions, id];
    updateData({ workConditions: updated });
  };

  return (
    <div className="space-y-5 animate-slide-left">
      <div>
        <h2 className="text-xl font-bold text-foreground">Risk Profile</h2>
        <p className="text-sm text-muted-foreground mt-1">Helps us calculate your ideal premium</p>
      </div>

      {/* Work Zones */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Work Zones</label>
        <div className="flex flex-wrap gap-2">
          {workZones.map(zone => (
            <button
              key={zone}
              onClick={() => toggleZone(zone)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200',
                data.workZones.includes(zone)
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-muted/30 text-foreground hover:border-primary/50'
              )}
            >
              {zone}
            </button>
          ))}
        </div>
      </div>

      {/* Peak Hours */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Peak working hours</label>
        <div className="grid grid-cols-2 gap-2">
          {peakOptions.map(opt => (
            <button
              key={opt.id}
              onClick={() => updateData({ peakHours: opt.id })}
              className={cn(
                'flex items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200',
                data.peakHours === opt.id
                  ? 'border-primary bg-primary/5 scale-[1.02]'
                  : 'border-border bg-muted/30 hover:border-primary/30'
              )}
            >
              <span className="text-xl">{opt.icon}</span>
              <span className="text-xs font-medium">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Working Conditions */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">You often work in…</label>
        <div className="grid grid-cols-2 gap-2">
          {workConditions.map(cond => (
            <button
              key={cond.id}
              onClick={() => toggleCondition(cond.id)}
              className={cn(
                'flex items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200',
                data.workConditions.includes(cond.id)
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-muted/30 hover:border-primary/30'
              )}
            >
              <span className="text-lg">{cond.icon}</span>
              <span className="text-xs font-medium">{cond.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepRiskProfile;
