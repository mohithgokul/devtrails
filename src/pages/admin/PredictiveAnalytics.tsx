import AdminLayout from '@/components/admin/AdminLayout';
import { forecastSummary, dailyForecast, weatherTriggers, districtRiskForecast, recommendedActions } from '@/lib/adminMockData';
import { formatCurrency } from '@/utils/formatCurrency';
import { cn } from '@/lib/utils';
import { CloudRain, Banknote, MapPin, AlertTriangle, Brain, CheckCircle, Eye } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const riskBadge = (risk: string) => {
    const styles: Record<string, string> = {
        critical: 'bg-destructive/10 text-destructive',
        high: 'bg-accent/10 text-accent-foreground',
        medium: 'bg-primary/10 text-primary',
        low: 'bg-secondary/10 text-secondary',
    };
    return <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold capitalize', styles[risk])}>{risk}</span>;
};

const triggerBadge = (status: string) => {
    if (status === 'trigger') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-destructive/10 text-destructive">🔴 LIKELY TO TRIGGER</span>;
    if (status === 'watch') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent/10 text-accent-foreground">🟡 WATCH</span>;
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary/10 text-secondary">🟢 SAFE</span>;
};

const actionIcon = (level: string) => {
    if (level === 'critical') return <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />;
    if (level === 'watch') return <Eye className="w-4 h-4 text-accent flex-shrink-0" />;
    return <CheckCircle className="w-4 h-4 text-secondary flex-shrink-0" />;
};

const PredictiveAnalytics = () => (
    <AdminLayout>
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-foreground">Predictive Analytics — Upcoming Risk Forecast</h1>
                <p className="text-xs text-muted-foreground mt-1">AI-powered forecast based on weather data, historical claims, and trigger thresholds</p>
                <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    📅 Next 7 Days: {forecastSummary.forecastPeriod}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Predicted Claims', value: forecastSummary.predictedClaims, icon: CloudRain, color: 'text-primary' },
                    { label: 'Estimated Payout', value: formatCurrency(forecastSummary.estimatedPayout), icon: Banknote, color: 'text-destructive' },
                    { label: 'High-Risk Districts', value: forecastSummary.highRiskDistricts, icon: MapPin, color: 'text-accent' },
                    { label: 'Trigger Probability', value: `${forecastSummary.triggerProbability}%`, icon: AlertTriangle, color: 'text-destructive' },
                ].map((kpi, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 border border-border/50 shadow-sm animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                            <kpi.icon className={cn('w-4 h-4', kpi.color)} />
                        </div>
                        <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                    </div>
                ))}
            </div>

            {/* Day-by-Day Chart */}
            <div className="bg-white rounded-xl p-5 border border-border/50 shadow-sm animate-fade-in-up">
                <h3 className="text-sm font-semibold text-foreground mb-1">Day-by-Day Claim Forecast</h3>
                <p className="text-xs text-muted-foreground mb-4">Predicted claim volume with weather conditions</p>
                <div className="h-64">
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
                {/* Day labels with weather */}
                <div className="flex justify-around mt-2">
                    {dailyForecast.map(d => (
                        <div key={d.day} className="text-center">
                            <span className="text-sm">{d.weather}</span>
                            <p className="text-[9px] text-muted-foreground">{d.probability}%</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Weather Trigger Threshold */}
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
                        {weatherTriggers.map((t, i) => (
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

            {/* District Risk */}
            <div className="bg-white rounded-xl border border-border/50 shadow-sm overflow-hidden animate-fade-in-up">
                <div className="p-4 border-b border-border/50">
                    <h3 className="text-sm font-semibold text-foreground">District Risk Map — Andhra Pradesh & Telangana</h3>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/30">
                            <TableHead className="text-xs">District</TableHead>
                            <TableHead className="text-xs">Active Policies</TableHead>
                            <TableHead className="text-xs">Predicted Claims</TableHead>
                            <TableHead className="text-xs">Est. Payout (₹)</TableHead>
                            <TableHead className="text-xs">Risk Level</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {districtRiskForecast.map((row, i) => (
                            <TableRow key={i} className={cn(row.risk === 'critical' ? 'bg-destructive/5' : row.risk === 'high' ? 'bg-accent/5' : '')}>
                                <TableCell className="text-xs font-medium">{row.district}</TableCell>
                                <TableCell className="text-xs">{row.activePolicies}</TableCell>
                                <TableCell className="text-xs">{row.predictedClaims}</TableCell>
                                <TableCell className="text-xs">{formatCurrency(row.estPayout)}</TableCell>
                                <TableCell>{riskBadge(row.risk)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Model Confidence */}
            <div className="bg-white rounded-xl p-5 border border-border/50 shadow-sm animate-fade-in-up">
                <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-5 h-5 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Predictive Model Confidence</h3>
                </div>
                <p className="text-2xl font-bold text-foreground mb-1">87% Accuracy</p>
                <p className="text-xs text-muted-foreground mb-3">Last 4 weeks performance</p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="px-2 py-0.5 rounded bg-muted">IMD Weather API</span>
                    <span className="px-2 py-0.5 rounded bg-muted">Historical Claims</span>
                    <span className="px-2 py-0.5 rounded bg-muted">Policy Trigger Rules</span>
                </div>
            </div>

            {/* Recommended Actions */}
            <div className="bg-white rounded-xl p-5 border border-border/50 shadow-sm animate-fade-in-up">
                <h3 className="text-sm font-semibold text-foreground mb-4">Recommended Actions</h3>
                <div className="space-y-3">
                    {recommendedActions.map((action, i) => (
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

export default PredictiveAnalytics;