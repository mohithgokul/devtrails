import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { dailyForecast, weatherTriggers, recommendedActions } from '@/lib/adminMockData';
import { formatCurrency } from '@/utils/formatCurrency';
import { cn } from '@/lib/utils';
import {
    CloudRain, Banknote, MapPin, AlertTriangle, Brain,
    CheckCircle, Eye, Zap, Users, RefreshCw,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// ── Helpers ──────────────────────────────────────────────────────────────────

const riskBadge = (risk: string) => {
    const styles: Record<string, string> = {
        critical: 'bg-destructive/10 text-destructive',
        high:     'bg-accent/10 text-accent-foreground',
        medium:   'bg-primary/10 text-primary',
        low:      'bg-secondary/10 text-secondary',
    };
    return (
        <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold capitalize', styles[risk] || 'bg-muted text-muted-foreground')}>
            {risk}
        </span>
    );
};

const riskBar = (prob: number) => {
    const pct = Math.round(prob * 100);
    const color = prob >= 0.75 ? 'bg-destructive' : prob >= 0.5 ? 'bg-accent' : prob >= 0.3 ? 'bg-primary' : 'bg-secondary';
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] font-mono font-bold text-muted-foreground w-8 text-right">{pct}%</span>
        </div>
    );
};

const triggerBadge = (status: string) => {
    if (status === 'trigger') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-destructive/10 text-destructive">🔴 LIKELY TO TRIGGER</span>;
    if (status === 'watch')   return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent/10 text-accent-foreground">🟡 WATCH</span>;
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary/10 text-secondary">🟢 SAFE</span>;
};

const actionIcon = (level: string) => {
    if (level === 'critical') return <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />;
    if (level === 'watch')    return <Eye className="w-4 h-4 text-accent flex-shrink-0" />;
    return <CheckCircle className="w-4 h-4 text-secondary flex-shrink-0" />;
};

// ── Component ─────────────────────────────────────────────────────────────────

const PredictiveAnalytics = () => {
    const [workerRisks, setWorkerRisks] = useState<any[]>([]);
    const [mlAvailable, setMlAvailable] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    // Live scorer state
    const [scorer, setScorer] = useState({ rain: 0, temp: 32, aqi: 90, demand_drop: 0, curfew: 0, hourly_income: 100, daily_hours: 8 });
    const [scoreResult, setScoreResult] = useState<any>(null);
    const [scoring, setScoring] = useState(false);

    const getToken = () => {
        try { return JSON.parse(localStorage.getItem('surakshapay_admin') || '{}').token; } catch { return ''; }
    };

    const fetchRisks = async () => {
        setLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/api/admin/risk/workers`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (res.ok) {
                const data = await res.json();
                setWorkerRisks(data.workers);
                setMlAvailable(data.ml_available);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRisks(); }, []);

    const runScorer = async () => {
        setScoring(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/api/admin/risk/score`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify(scorer),
            });
            if (res.ok) setScoreResult(await res.json());
        } catch (err) {
            console.error(err);
        } finally {
            setScoring(false);
        }
    };

    const criticalCount = workerRisks.filter(w => w.risk_level === 'critical').length;
    const highCount     = workerRisks.filter(w => w.risk_level === 'high').length;
    const avgRisk       = workerRisks.length
        ? Math.round(workerRisks.reduce((s, w) => s + w.risk_probability, 0) / workerRisks.length * 100)
        : 0;

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-xl font-bold text-foreground">Predictive Analytics — Risk Intelligence</h1>
                    <p className="text-xs text-muted-foreground mt-1">ML-powered risk scoring for all workers + live environmental scorer</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <div className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium',
                            mlAvailable === true ? 'bg-secondary/10 text-secondary' : 'bg-accent/10 text-accent-foreground'
                        )}>
                            <Brain className="w-3.5 h-3.5" />
                            {mlAvailable === null ? 'Loading...' : mlAvailable ? '🤖 ML Model Active' : '📐 Rule-Based Fallback'}
                        </div>
                        <button
                            onClick={fetchRisks}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 transition-colors"
                        >
                            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Workers Scored', value: workerRisks.length, icon: Users, color: 'text-primary' },
                        { label: 'Critical Risk', value: criticalCount, icon: AlertTriangle, color: 'text-destructive' },
                        { label: 'High Risk', value: highCount, icon: Zap, color: 'text-accent' },
                        { label: 'Avg Risk Score', value: `${avgRisk}%`, icon: Brain, color: 'text-primary' },
                    ].map((kpi, i) => (
                        <div key={i} className="bg-white rounded-xl p-4 border border-border/50 shadow-sm animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                                <kpi.icon className={cn('w-4 h-4', kpi.color)} />
                            </div>
                            <p className="text-2xl font-bold text-foreground">{loading ? '...' : kpi.value}</p>
                        </div>
                    ))}
                </div>

                {/* Live Scorer */}
                <div className="bg-white rounded-xl p-5 border border-border/50 shadow-sm animate-fade-in-up">
                    <div className="flex items-center gap-2 mb-4">
                        <Zap className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-semibold text-foreground">Live Risk Scorer</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Real-time ML</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-4">
                        {[
                            { key: 'rain', label: 'Rain (mm/hr)', max: 200 },
                            { key: 'temp', label: 'Temp (°C)', max: 55 },
                            { key: 'aqi', label: 'AQI', max: 500 },
                            { key: 'demand_drop', label: 'Demand Drop %', max: 100 },
                            { key: 'curfew', label: 'Curfew (0/1)', max: 1 },
                            { key: 'hourly_income', label: 'Hourly ₹', max: 500 },
                            { key: 'daily_hours', label: 'Daily Hrs', max: 16 },
                        ].map(({ key, label, max }) => (
                            <div key={key} className="flex flex-col gap-1">
                                <label className="text-[10px] font-medium text-muted-foreground">{label}</label>
                                <input
                                    type="number"
                                    min={0}
                                    max={max}
                                    value={(scorer as any)[key]}
                                    onChange={e => setScorer(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                                    className="w-full px-2 py-1.5 rounded-lg border border-border text-xs font-mono focus:border-primary focus:outline-none"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={runScorer}
                            disabled={scoring}
                            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {scoring ? 'Scoring...' : '🔍 Score Risk'}
                        </button>
                        {scoreResult && (
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-2">
                                    {riskBadge(scoreResult.risk_level)}
                                    <span className="text-sm font-bold text-foreground">
                                        {Math.round(scoreResult.risk_probability * 100)}% risk
                                    </span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {scoreResult.contributing_factors?.slice(0, 2).join(' · ')}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Worker Risk Table */}
                <div className="bg-white rounded-xl border border-border/50 shadow-sm overflow-hidden animate-fade-in-up">
                    <div className="p-4 border-b border-border/50 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-foreground">Worker Risk Rankings</h3>
                        <span className="text-xs text-muted-foreground">Sorted highest → lowest risk</span>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30">
                                <TableHead className="text-xs">Worker</TableHead>
                                <TableHead className="text-xs">City</TableHead>
                                <TableHead className="text-xs">Plan</TableHead>
                                <TableHead className="text-xs">Claims</TableHead>
                                <TableHead className="text-xs">Risk Score</TableHead>
                                <TableHead className="text-xs">Risk Level</TableHead>
                                <TableHead className="text-xs">Top Factor</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">
                                        Scoring workers with ML model...
                                    </TableCell>
                                </TableRow>
                            ) : workerRisks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">
                                        No workers found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                workerRisks.map((row, i) => (
                                    <TableRow
                                        key={i}
                                        className={cn(
                                            'hover:bg-muted/20 transition-colors',
                                            row.risk_level === 'critical' ? 'bg-destructive/5' : row.risk_level === 'high' ? 'bg-accent/5' : ''
                                        )}
                                    >
                                        <TableCell className="text-xs font-medium">{row.full_name}</TableCell>
                                        <TableCell className="text-xs capitalize">{row.city || '—'}</TableCell>
                                        <TableCell className="text-xs capitalize">{row.plan_name || 'None'}</TableCell>
                                        <TableCell className="text-xs">{row.claims_filed}</TableCell>
                                        <TableCell className="text-xs min-w-[120px]">{riskBar(row.risk_probability)}</TableCell>
                                        <TableCell>{riskBadge(row.risk_level)}</TableCell>
                                        <TableCell className="text-[10px] text-muted-foreground max-w-[160px] truncate">
                                            {row.contributing_factors?.[0] || '—'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Day-by-Day Chart (static mock until time-series is seeded) */}
                <div className="bg-white rounded-xl p-5 border border-border/50 shadow-sm animate-fade-in-up">
                    <h3 className="text-sm font-semibold text-foreground mb-1">7-Day Claim Forecast</h3>
                    <p className="text-xs text-muted-foreground mb-4">Predicted claim volume with weather conditions</p>
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dailyForecast}>
                                <defs>
                                    <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(0 84% 60%)" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="hsl(0 84% 60%)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(215 16% 47%)" />
                                <YAxis tick={{ fontSize: 10 }} stroke="hsl(215 16% 47%)" />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (!active || !payload?.[0]) return null;
                                        const d = payload[0].payload;
                                        return (
                                            <div className="bg-white rounded-lg shadow-lg border border-border p-3 text-xs">
                                                <p className="font-semibold">{d.day} {d.date} {d.weather}</p>
                                                <p>Predicted claims: <strong>{d.claims}</strong></p>
                                                <p>Trigger probability: <strong>{d.probability}%</strong></p>
                                            </div>
                                        );
                                    }}
                                />
                                <Area type="monotone" dataKey="claims" stroke="hsl(0 84% 60%)" strokeWidth={2.5} fill="url(#forecastGrad)" dot={{ fill: 'hsl(0 84% 60%)', r: 4 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Weather Trigger Table */}
                <div className="bg-white rounded-xl border border-border/50 shadow-sm overflow-hidden animate-fade-in-up">
                    <div className="p-4 border-b border-border/50">
                        <h3 className="text-sm font-semibold text-foreground">Weather Trigger Thresholds</h3>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30">
                                <TableHead className="text-xs">Trigger</TableHead>
                                <TableHead className="text-xs">Threshold</TableHead>
                                <TableHead className="text-xs">Forecasted Value</TableHead>
                                <TableHead className="text-xs">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {weatherTriggers.map((t: any, i: number) => (
                                <TableRow key={i}>
                                    <TableCell className="text-xs font-medium">{t.trigger}</TableCell>
                                    <TableCell className="text-xs">{t.threshold}</TableCell>
                                    <TableCell className="text-xs">{t.forecast}</TableCell>
                                    <TableCell>{triggerBadge(t.status)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Recommended Actions */}
                <div className="bg-white rounded-xl p-5 border border-border/50 shadow-sm animate-fade-in-up">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Recommended Actions</h3>
                    <div className="space-y-3">
                        {recommendedActions.map((action: any, i: number) => (
                            <div key={i} className={cn(
                                'flex items-start gap-3 p-3 rounded-lg',
                                action.level === 'critical' ? 'bg-destructive/5' : action.level === 'watch' ? 'bg-accent/5' : 'bg-secondary/5'
                            )}>
                                {actionIcon(action.level)}
                                <p className="text-xs text-foreground leading-relaxed">{action.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default PredictiveAnalytics;