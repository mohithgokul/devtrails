import AdminLayout from '@/components/admin/AdminLayout';
import { adminPoliciesKPIs, policiesByProduct, policyTable } from '@/lib/adminMockData';
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

const AdminPolicies = () => (
    <AdminLayout>
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Active', value: adminPoliciesKPIs.totalActive.toLocaleString(), icon: FileText, color: 'text-primary' },
                    { label: 'New This Month', value: adminPoliciesKPIs.newThisMonth, icon: Plus, color: 'text-secondary' },
                    { label: 'Renewals Due', value: adminPoliciesKPIs.renewalsDue, icon: RefreshCw, color: 'text-accent' },
                    { label: 'Cancelled', value: adminPoliciesKPIs.cancelled, icon: XCircle, color: 'text-destructive' },
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
                                <Pie data={policiesByProduct} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                                    {policiesByProduct.map((entry, i) => <Cell key={i} fill={entry.color} />)}
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
                            <TableHead className="text-xs">District</TableHead>
                            <TableHead className="text-xs">Plan</TableHead>
                            <TableHead className="text-xs">Premium (₹/wk)</TableHead>
                            <TableHead className="text-xs">Coverage</TableHead>
                            <TableHead className="text-xs">Start Date</TableHead>
                            <TableHead className="text-xs">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {policyTable.map((row, i) => (
                            <TableRow key={i} className="hover:bg-muted/30 transition-colors">
                                <TableCell className="text-xs font-mono font-medium">{row.id}</TableCell>
                                <TableCell className="text-xs">{row.worker}</TableCell>
                                <TableCell className="text-xs">{row.district}</TableCell>
                                <TableCell className="text-xs font-medium">{row.plan}</TableCell>
                                <TableCell className="text-xs">{formatCurrency(row.premium)}</TableCell>
                                <TableCell className="text-xs">{row.coverage}%</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{row.startDate}</TableCell>
                                <TableCell>
                                    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold capitalize', statusStyles[row.status])}>
                                        {row.status}
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    </AdminLayout>
);

export default AdminPolicies;