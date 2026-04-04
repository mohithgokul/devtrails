import { getRiskLabel } from '@/utils/getRiskColor';
import GlassCard from '@/components/layout/GlassCard';

interface RiskData {
  riskScore: number;
  riskLevel: string;
  factors: string[];
  riskProbability: number;
}

interface RiskGaugeProps {
  riskData: RiskData | null;
}

const RiskGauge = ({ riskData }: RiskGaugeProps) => {
  // Show a pulsing skeleton while ML assessment is loading
  if (!riskData) {
    return (
      <GlassCard className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-muted/40 animate-pulse flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-20 rounded bg-muted/40 animate-pulse" />
          <div className="h-5 w-28 rounded bg-muted/40 animate-pulse" />
          <div className="h-3 w-36 rounded bg-muted/40 animate-pulse" />
        </div>
      </GlassCard>
    );
  }

  const score = riskData.riskScore;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s <= 30) return 'hsl(142 71% 45%)';
    if (s <= 60) return 'hsl(45 93% 58%)';
    return 'hsl(0 84% 60%)';
  };

  // Pick top factor (first in array) for display
  const topFactor = riskData.factors?.[0] || 'No significant disruption detected';

  return (
    <GlassCard className="space-y-3">
      <div className="flex items-center gap-4">
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
          <p className="text-xs text-muted-foreground">AI Risk Score</p>
          <p className="text-lg font-bold text-foreground">{getRiskLabel(score)}</p>
          <p className="text-sm font-medium text-foreground">Probability: {riskData.riskProbability.toFixed(4)}</p>
          <p className="text-xs text-secondary font-medium">Lower risk = lower premium 🎯</p>
        </div>
      </div>

      {/* Top contributing factor from ML model */}
      <div className="pt-2 border-t border-border/40">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Top Risk Factor</p>
        <p className="text-xs text-foreground/80 leading-relaxed">{topFactor}</p>
      </div>
    </GlassCard>
  );
};

export default RiskGauge;
