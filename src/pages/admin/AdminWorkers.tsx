import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { cn } from '@/lib/utils';
import { Users, Activity, UserX, AlertTriangle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const AdminWorkers = () => {
    const [workers, setWorkers] = useState<any[]>([]);

    useEffect(() => {
        const fetchWorkers = async () => {
            const adminStr = localStorage.getItem('surakshapay_admin');
            if(!adminStr) return;
            const admin = JSON.parse(adminStr);
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const res = await fetch(`${apiUrl}/api/admin/workers`, {
                    headers: { 'Authorization': `Bearer ${admin.token}` }
                });
                if(res.ok) {
                    const data = await res.json();
                    setWorkers(data.workers);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchWorkers();
    }, []);

    const activeCount = workers.filter(w => w.status === 'active').length;
    const inactiveCount = workers.filter(w => w.status !== 'active').length;

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Registered', value: workers.length.toLocaleString(), icon: Users, color: 'text-primary' },
                        { label: 'Active Policies', value: activeCount.toLocaleString(), icon: Activity, color: 'text-secondary' },
                        { label: 'Inactive Policies', value: inactiveCount.toLocaleString(), icon: UserX, color: 'text-muted-foreground' },
                        { label: 'High Risk', value: '-', icon: AlertTriangle, color: 'text-destructive' },
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
                                <TableHead className="text-xs">City</TableHead>
                                <TableHead className="text-xs">Plan</TableHead>
                                <TableHead className="text-xs">Claims</TableHead>
                                <TableHead className="text-xs">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {workers.map((row, i) => (
                                <TableRow key={i} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="text-xs font-medium">{row.full_name}</TableCell>
                                    <TableCell className="text-xs font-mono">{row.phone}</TableCell>
                                    <TableCell className="text-xs capitalize">{row.city || 'Unknown'}</TableCell>
                                    <TableCell className="text-xs capitalize">{row.plan_name || 'None'}</TableCell>
                                    <TableCell className="text-xs">{row.claims_filed}</TableCell>
                                    <TableCell>
                                        <span className={cn(
                                            'px-2 py-0.5 rounded-full text-[10px] font-bold capitalize',
                                            row.status === 'active' ? 'bg-secondary/10 text-secondary' : 'bg-muted text-muted-foreground'
                                        )}>
                                            {row.status || 'inactive'}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {workers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-sm text-muted-foreground">
                                        No workers found.
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

export default AdminWorkers;