import { userProfile } from '@/lib/mockData';
import { getRiskLabel } from '@/utils/getRiskColor';
import GlassCard from '@/components/layout/GlassCard';

const RiskGauge = () => {
  const score = userProfile.riskScore;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s <= 30) return 'hsl(142 71% 45%)';
    if (s <= 60) return 'hsl(45 93% 58%)';
    return 'hsl(0 84% 60%)';
  };

  return (
    <GlassCard className="flex items-center gap-4">
      <div className="relative w-20 h-20 flex-shrink-0">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(210 40% 96%)" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="45" fill="none"
            stroke={getColor(score)}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-foreground">{score}</span>
        </div>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Risk Score</p>
        <p className="text-lg font-bold text-foreground">{getRiskLabel(score)}</p>
        <p className="text-xs text-secondary font-medium">Lower risk = lower premium 🎯</p>
      </div>
    </GlassCard>
  );
};

export default RiskGauge;
