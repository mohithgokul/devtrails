import AdminLayout from '@/components/admin/AdminLayout';
import { workersKPIs, workersTable } from '@/lib/adminMockData';
import { cn } from '@/lib/utils';
import { Users, Activity, UserX, AlertTriangle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const riskColor = (score: number) => {
    if (score > 60) return 'text-destructive';
    if (score > 40) return 'text-accent-foreground';
    return 'text-secondary';
};

const AdminWorkers = () => (
    <AdminLayout>
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Registered', value: workersKPIs.totalRegistered.toLocaleString(), icon: Users, color: 'text-primary' },
                    { label: 'Active This Week', value: workersKPIs.activeThisWeek.toLocaleString(), icon: Activity, color: 'text-secondary' },
                    { label: 'Inactive', value: workersKPIs.inactive, icon: UserX, color: 'text-muted-foreground' },
                    { label: 'High Risk', value: workersKPIs.highRisk, icon: AlertTriangle, color: 'text-destructive' },
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

            {/* Table */}
            <div className="bg-white rounded-xl border border-border/50 shadow-sm overflow-hidden animate-fade-in-up">
                <div className="p-4 border-b border-border/50">
                    <h3 className="text-sm font-semibold text-foreground">Worker Directory</h3>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/30">
                            <TableHead className="text-xs">Name</TableHead>
                            <TableHead className="text-xs">Phone</TableHead>
                            <TableHead className="text-xs">District</TableHead>
                            <TableHead className="text-xs">Platform</TableHead>
                            <TableHead className="text-xs">Plan</TableHead>
                            <TableHead className="text-xs">Risk Score</TableHead>
                            <TableHead className="text-xs">Claims</TableHead>
                            <TableHead className="text-xs">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {workersTable.map((row, i) => (
                            <TableRow key={i} className="hover:bg-muted/30 transition-colors">
                                <TableCell className="text-xs font-medium">{row.name}</TableCell>
                                <TableCell className="text-xs font-mono">{row.phone}</TableCell>
                                <TableCell className="text-xs">{row.district}</TableCell>
                                <TableCell className="text-xs">{row.platform}</TableCell>
                                <TableCell className="text-xs">{row.plan}</TableCell>
                                <TableCell className={cn('text-xs font-bold', riskColor(row.riskScore))}>{row.riskScore}</TableCell>
                                <TableCell className="text-xs">{row.claimsFiled}</TableCell>
                                <TableCell>
                                    <span className={cn(
                                        'px-2 py-0.5 rounded-full text-[10px] font-bold capitalize',
                                        row.status === 'active' ? 'bg-secondary/10 text-secondary' : 'bg-muted text-muted-foreground'
                                    )}>
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

export default AdminWorkers;