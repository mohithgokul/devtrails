import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { premiumVsClaims } from '@/lib/adminMockData';
import { formatCurrency } from '@/utils/formatCurrency';
import { FileText, Banknote, ClipboardList, TrendingUp, TrendingDown, AlertTriangle, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart } from 'recharts';
import { cn } from '@/lib/utils';

const alertStyles = {
    warning: 'border-l-accent bg-accent/5',
    critical: 'border-l-destructive bg-destructive/5',
    info: 'border-l-primary bg-primary/5',
};
const alertIcons = {
    warning: '⚠️',
    critical: '🔴',
    info: 'ℹ️',
};

const AdminDashboard = () => {
    const [stats, setStats] = useState<any>(null);
    const [alerts, setAlerts] = useState<any[]>([]);

    useEffect(() => {
        const fetchStatsAndAlerts = async () => {
            const adminStr = localStorage.getItem('surakshapay_admin');
            if(!adminStr) return;
            const admin = JSON.parse(adminStr);
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                
                // Fetch stats
                const statsRes = await fetch(`${apiUrl}/api/admin/stats`, {
                    headers: { 'Authorization': `Bearer ${admin.token}` }
                });
                if(statsRes.ok) setStats(await statsRes.json());

                // Fetch notifications (alerts)
                const notifsRes = await fetch(`${apiUrl}/api/admin/notifications`, {
                    headers: { 'Authorization': `Bearer ${admin.token}` }
                });
                if(notifsRes.ok) {
                    const data = await notifsRes.json();
                    setAlerts(data.notifications || []);
                }
            } catch (err) {
                console.error('Failed to fetch admin stats', err);
            }
        };
        fetchStatsAndAlerts();
    }, []);

    const kpiCards = [
        { label: 'Total Active Policies', value: stats ? stats.totalActivePolicies.toLocaleString() : '...', change: stats?.policyChange, icon: FileText, color: 'text-primary' },
        { label: 'Premiums Collected', value: stats ? formatCurrency(stats.totalPremiums) : '...', change: stats?.premiumChange, icon: Banknote, color: 'text-secondary' },
        { label: 'Claims Paid', value: stats ? formatCurrency(stats.totalClaimsPaid) : '...', change: stats?.claimsChange, icon: ClipboardList, color: 'text-accent' },
        { label: 'Overall Loss Ratio', value: stats ? `${stats.overallLossRatio}%` : '...', change: null, icon: TrendingUp, color: (stats?.overallLossRatio || 0) > 80 ? 'text-destructive' : (stats?.overallLossRatio || 0) > 60 ? 'text-accent' : 'text-secondary' },
    ];

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {kpiCards.map((kpi, i) => (
                        <div key={i} className="bg-white rounded-xl p-4 border border-border/50 shadow-sm animate-fade-in-up hover:shadow-md transition-shadow" style={{ animationDelay: `${i * 80}ms` }}>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                                <kpi.icon className={cn('w-4 h-4', kpi.color)} />
                            </div>
                            <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                            {kpi.change !== null && kpi.change !== undefined && (
                                <div className={cn('flex items-center gap-1 mt-1 text-xs font-medium', kpi.change > 0 ? 'text-secondary' : 'text-destructive')}>
                                    {kpi.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    {Math.abs(kpi.change)}% from last week
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Chart + Alerts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Chart */}
                    <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-border/50 shadow-sm animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                        <h3 className="text-sm font-semibold text-foreground mb-1">Premiums vs Claims Paid</h3>
                        <p className="text-xs text-muted-foreground mb-4">Last 6 months</p>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={premiumVsClaims}>
                                    <defs>
                                        <linearGradient id="premGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(239 84% 67%)" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="hsl(239 84% 67%)" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="claimGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(0 84% 60%)" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="hsl(0 84% 60%)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(215 16% 47%)" />
                                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(215 16% 47%)" width={50} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '12px' }} />
                                    <Area type="monotone" dataKey="premiums" stroke="hsl(239 84% 67%)" strokeWidth={2} fill="url(#premGrad)" />
                                    <Area type="monotone" dataKey="claims" stroke="hsl(0 84% 60%)" strokeWidth={2} fill="url(#claimGrad)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex gap-4 mt-3">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><div className="w-3 h-1 rounded bg-[hsl(239_84%_67%)]" /> Premiums</div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><div className="w-3 h-1 rounded bg-destructive" /> Claims</div>
                        </div>
                    </div>

                    {/* Alerts */}
                    <div className="bg-white rounded-xl p-5 border border-border/50 shadow-sm animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                        <h3 className="text-sm font-semibold text-foreground mb-4">⚡ Active Alerts</h3>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                            {alerts.length === 0 ? (
                                <p className="text-xs text-muted-foreground">No active alerts.</p>
                            ) : (
                                alerts.map((alert: any, i: number) => (
                                    <div key={i} className={cn('p-3 rounded-lg border-l-4 text-xs leading-relaxed text-foreground', alertStyles[alert.type as keyof typeof alertStyles] || alertStyles.info)}>
                                        {alertIcons[alert.type as keyof typeof alertIcons] || alertIcons.info} {alert.message}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;