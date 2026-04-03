import { OnboardingData } from '@/hooks/useOnboarding';
import { MapPin, Navigation, Activity, Bell, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  data: OnboardingData;
  updateData: (d: Partial<OnboardingData>) => void;
}

const toggleItems = [
  {
    key: 'gpsEnabled' as const,
    icon: Navigation,
    label: 'Enable GPS',
    desc: 'Auto-detect weather & disruptions in your area',
  },
  {
    key: 'activityTracking' as const,
    icon: Activity,
    label: 'Activity Tracking',
    desc: 'Validate work hours for faster claim approvals',
  },
  {
    key: 'notifications' as const,
    icon: Bell,
    label: 'Notifications',
    desc: 'Get alerts for triggers, claims, and payouts',
  },
];

const StepLocation = ({ data, updateData }: Props) => {
  return (
    <div className="space-y-5 animate-slide-left">
      <div>
        <h2 className="text-xl font-bold text-foreground">Location & Permissions</h2>
        <p className="text-sm text-muted-foreground mt-1">Enable features for better protection</p>
      </div>

      {/* Map Preview */}
      <div className="relative rounded-2xl overflow-hidden h-40 bg-muted border border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-10 h-10 text-primary mx-auto mb-2 animate-float" />
            <p className="text-sm font-medium text-foreground">Your delivery zone</p>
            <p className="text-xs text-muted-foreground">Enable GPS for precise coverage</p>
          </div>
        </div>
        {/* Decorative grid */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'linear-gradient(hsl(217 91% 53%) 1px, transparent 1px), linear-gradient(90deg, hsl(217 91% 53%) 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }} />
      </div>

      {/* Permission Toggles */}
      <div className="space-y-3">
        {toggleItems.map(({ key, icon: Icon, label, desc }) => (
          <button
            key={key}
            onClick={() => updateData({ [key]: !data[key] })}
            className={cn(
              'w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-left',
              data[key]
                ? 'border-primary bg-primary/5'
                : 'border-border bg-muted/30'
            )}
          >
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
              data[key] ? 'gradient-primary' : 'bg-muted'
            )}>
              <Icon className={cn('w-5 h-5', data[key] ? 'text-primary-foreground' : 'text-muted-foreground')} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            <div className={cn(
              'w-11 h-6 rounded-full transition-colors relative',
              data[key] ? 'bg-primary' : 'bg-muted'
            )}>
              <div className={cn(
                'absolute top-0.5 w-5 h-5 rounded-full bg-primary-foreground shadow transition-transform',
                data[key] ? 'translate-x-5' : 'translate-x-0.5'
              )} />
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
        <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          Enabling all permissions helps us provide faster claims and more accurate risk assessment. Your data is encrypted and never shared.
        </p>
      </div>
    </div>
  );
};

export default StepLocation;
