import GlassCard from '@/components/layout/GlassCard';

interface RawSignals {
  rain: number;
  temp: number;
  aqi: number;
  demand_drop: number;
  curfew: number;
  hourly_income: number;
  daily_hours: number;
}

interface Sources {
  weather?: string;
  aqi?: string;
  news?: string;
}

interface SignalsData {
  city: string;
  raw_signals: RawSignals;
  feature_vector: number[];
  sources: Sources;
}

interface SignalsCardProps {
  signalsData: SignalsData | null;
}

const sourceLabel = (s: string | undefined) => {
  if (!s) return '—';
  const map: Record<string, string> = {
    openweathermap_coords: 'OWM (GPS)',
    openweathermap: 'OWM (city)',
    waqi: 'WAQI',
    gnews: 'GNews',
    newsapi: 'NewsAPI',
    mock: 'Mock / offline',
  };
  return map[s] ?? s;
};

const SignalRow = ({
  label,
  value,
  unit,
  icon,
  highlight,
}: {
  label: string;
  value: number | string;
  unit?: string;
  icon: string;
  highlight?: boolean;
}) => (
  <div
    className={`flex items-center justify-between py-2 px-3 rounded-xl transition-colors ${
      highlight ? 'bg-destructive/10 border border-destructive/20' : 'bg-muted/30'
    }`}
  >
    <div className="flex items-center gap-2">
      <span className="text-base">{icon}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
    <span className={`text-xs font-semibold ${highlight ? 'text-destructive' : 'text-foreground'}`}>
      {value}
      {unit && <span className="text-muted-foreground font-normal ml-0.5">{unit}</span>}
    </span>
  </div>
);

const SourceBadge = ({ label, value }: { label: string; value: string | undefined }) => (
  <div className="flex items-center gap-1.5">
    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
    <span className="text-[10px] font-medium bg-primary/15 text-primary px-2 py-0.5 rounded-full">
      {sourceLabel(value)}
    </span>
  </div>
);

const SignalsCard = ({ signalsData }: SignalsCardProps) => {
  // Skeleton while loading
  if (!signalsData) {
    return (
      <GlassCard className="space-y-3">
        <div className="h-4 w-40 rounded bg-muted/40 animate-pulse" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-9 rounded-xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      </GlassCard>
    );
  }

  const s = signalsData.raw_signals;

  return (
    <GlassCard className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Live Signals</p>
          <p className="text-sm font-bold text-foreground">
            ML Input · {signalsData.city || 'Unknown location'}
          </p>
        </div>
        <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center text-base">
          📡
        </div>
      </div>

      {/* Signal rows */}
      <div className="space-y-1.5">
        <SignalRow label="Rainfall" value={s.rain.toFixed(1)} unit=" mm/hr" icon="🌧️" highlight={s.rain > 20} />
        <SignalRow label="Temperature" value={s.temp.toFixed(1)} unit="°C" icon="🌡️" highlight={s.temp > 40} />
        <SignalRow label="AQI" value={s.aqi} icon="💨" highlight={s.aqi > 150} />
        <SignalRow label="Demand Drop" value={`${s.demand_drop}%`} icon="📉" highlight={s.demand_drop > 30} />
        <SignalRow
          label="Curfew"
          value={s.curfew === 1 ? 'Active ⚠️' : 'None'}
          icon="🚧"
          highlight={s.curfew === 1}
        />
        <SignalRow label="Hourly Income" value={`₹${s.hourly_income}`} unit="/hr" icon="💰" />
        <SignalRow label="Daily Hours" value={s.daily_hours} unit="h" icon="⏱️" />
      </div>

      {/* Feature vector sent to risk_model */}
      <div className="pt-2 border-t border-border/40">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">
          Feature vector → risk_model
        </p>
        <div className="flex flex-wrap gap-1">
          {signalsData.feature_vector.map((v, i) => (
            <span
              key={i}
              className="text-[10px] font-mono bg-muted/40 text-foreground/70 px-1.5 py-0.5 rounded"
            >
              {typeof v === 'number' ? v.toFixed(2) : v}
            </span>
          ))}
        </div>
        <p className="text-[9px] text-muted-foreground/60 mt-1">
          [rain, temp, aqi, demand_drop, curfew, hourly_income, daily_hours]
        </p>
      </div>

      {/* API sources */}
      <div className="pt-2 border-t border-border/40">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">
          Data sources
        </p>
        <div className="flex flex-wrap gap-2">
          <SourceBadge label="Weather" value={signalsData.sources.weather} />
          <SourceBadge label="AQI" value={signalsData.sources.aqi} />
          <SourceBadge label="News" value={signalsData.sources.news} />
        </div>
      </div>
    </GlassCard>
  );
};

export default SignalsCard;
