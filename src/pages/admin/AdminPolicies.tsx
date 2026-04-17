import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { formatCurrency } from '@/utils/formatCurrency';
import { cn } from '@/lib/utils';
import { FileText, Plus, RefreshCw, XCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const statusStyles: Record<string, string> = {
    active: 'bg-secondary/10 text-secondary',
    renewal: 'bg-accent/10 text-accent-foreground',
    cancelled: 'bg-destructive/10 text-destructive',
};

const PLAN_COLORS: Record<string, string> = {
    basic: 'hsl(var(--primary))',
    standard: 'hsl(var(--secondary))',
    pro: 'hsl(var(--accent))'
};

const AdminPolicies = () => {
    const [policies, setPolicies] = useState<any[]>([]);

    useEffect(() => {
        const fetchPolicies = async () => {
            const adminStr = localStorage.getItem('surakshapay_admin');
            if(!adminStr) return;
            const admin = JSON.parse(adminStr);
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const res = await fetch(`${apiUrl}/api/admin/policies`, {
                    headers: { 'Authorization': `Bearer ${admin.token}` }
                });
                if(res.ok) {
                    const data = await res.json();
                    setPolicies(data.policies);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchPolicies();
    }, []);

    const activeCount = policies.filter(p => p.status === 'active').length;
    const cancelledCount = policies.filter(p => p.status === 'cancelled').length;
    const renewalCount = policies.filter(p => p.status === 'renewal').length;

    // Build the dynamic Pie chart data
    const planCounts = policies.reduce((acc: any, p) => {
        const plan = p.plan_name?.toLowerCase() || 'unknown';
        acc[plan] = (acc[plan] || 0) + 1;
        return acc;
    }, {});

    const policiesByProduct = Object.keys(planCounts).map(plan => ({
        name: plan.charAt(0).toUpperCase() + plan.slice(1) + ' Plan',
        value: planCounts[plan],
        color: PLAN_COLORS[plan] || 'hsl(var(--muted-foreground))'
    }));

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Active', value: activeCount.toLocaleString(), icon: FileText, color: 'text-primary' },
                        { label: 'New This Month', value: activeCount, icon: Plus, color: 'text-secondary' }, // Mocking 'New this month' using active
                        { label: 'Renewals Due', value: renewalCount, icon: RefreshCw, color: 'text-accent' },
                        { label: 'Cancelled', value: cancelledCount, icon: XCircle, color: 'text-destructive' },
                    ].map((kpi, i) => (
                        <div key={i} className="bg-white rounded-xl p-4 border border-border/50 shadow-sm animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                                <kpi.icon className={cn('w-4 h-4', kpi.color)} />
                            </div>
                            <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                        </div>
                    ))}
                </div>

                {/* Donut + Legend */}
                <div className="bg-white rounded-xl p-5 border border-border/50 shadow-sm animate-fade-in-up">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Policies by Product Type</h3>
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="w-48 h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={policiesByProduct.length ? policiesByProduct : [{name: 'None', value: 1, color: '#ccc'}]} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                                        {(policiesByProduct.length ? policiesByProduct : [{name: 'None', value: 1, color: '#ccc'}]).map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}
                                    </Pie>
                                    <Tooltip formatter={(v: number) => v.toLocaleString()} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '12px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-2">
                            {policiesByProduct.map((p, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ background: p.color }} />
                                    <span className="text-xs text-foreground font-medium">{p.name}</span>
                                    <span className="text-xs text-muted-foreground">({p.value})</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Policy Table */}
                <div className="bg-white rounded-xl border border-border/50 shadow-sm overflow-hidden animate-fade-in-up">
                    <div className="p-4 border-b border-border/50">
                        <h3 className="text-sm font-semibold text-foreground">Policy Directory</h3>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30">
                                <TableHead className="text-xs">Policy ID</TableHead>
                                <TableHead className="text-xs">Worker</TableHead>
                                <TableHead className="text-xs">City</TableHead>
                                <TableHead className="text-xs">Plan</TableHead>
                                <TableHead className="text-xs">Premium (₹/wk)</TableHead>
                                <TableHead className="text-xs">Coverage</TableHead>
                                <TableHead className="text-xs">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {policies.map((row, i) => (
                                <TableRow key={i} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="text-xs font-mono font-medium">#{row.id}</TableCell>
                                    <TableCell className="text-xs">{row.full_name}</TableCell>
                                    <TableCell className="text-xs capitalize">{row.city || 'Unknown'}</TableCell>
                                    <TableCell className="text-xs font-medium capitalize">{row.plan_name}</TableCell>
                                    <TableCell className="text-xs">{formatCurrency(row.weekly_premium)}</TableCell>
                                    <TableCell className="text-xs">{row.coverage_factor ? `${Math.round(row.coverage_factor * 100)}%` : 'N/A'}</TableCell>
                                    <TableCell>
                                        <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold capitalize', statusStyles[row.status] || 'bg-muted text-muted-foreground')}>
                                            {row.status || 'inactive'}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {policies.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">
                                        No policies found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminPolicies;