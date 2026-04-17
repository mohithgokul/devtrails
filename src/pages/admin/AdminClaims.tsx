import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { formatCurrency } from '@/utils/formatCurrency';
import { cn } from '@/lib/utils';
import { ClipboardList, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

const statusStyles: Record<string, string> = {
    pending: 'bg-accent/10 text-accent-foreground',
    processing: 'bg-accent/10 text-accent-foreground',
    auto_approved: 'bg-secondary/10 text-secondary',
    approved: 'bg-secondary/10 text-secondary',
    paid: 'bg-primary/10 text-primary',
    rejected: 'bg-destructive/10 text-destructive',
};

const AdminClaims = () => {
    const [claims, setClaims] = useState<any[]>([]);
    const [selectedClaim, setSelectedClaim] = useState<any | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        const fetchClaims = async () => {
            const adminStr = localStorage.getItem('surakshapay_admin');
            if(!adminStr) return;
            const admin = JSON.parse(adminStr);
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const res = await fetch(`${apiUrl}/api/admin/claims`, {
                    headers: { 'Authorization': `Bearer ${admin.token}` }
                });
                if(res.ok) {
                    const data = await res.json();
                    setClaims(data.claims);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchClaims();
    }, []);

    const updateClaimStatus = async (claimId: number, newStatus: string) => {
        const adminStr = localStorage.getItem('surakshapay_admin');
        if (!adminStr) return;
        const admin = JSON.parse(adminStr);
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/claims/${claimId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${admin.token}`,
            },
            body: JSON.stringify({ status: newStatus }),
        });
        if (res.ok) {
            setClaims(prev => prev.map(c => c.id === claimId ? { ...c, status: newStatus } : c));
            setSelectedClaim((prev: any) => prev ? { ...prev, status: newStatus } : null);
        }
    };

    const filtered = statusFilter === 'all' ? claims : claims.filter(c => c.status === statusFilter || (statusFilter === 'processing' && c.status === 'pending') || (statusFilter === 'approved' && c.status === 'auto_approved'));

    const activeCount = claims.length;
    const pendingCount = claims.filter(c => c.status === 'pending' || c.status === 'processing').length;
    const approvedCount = claims.filter(c => c.status === 'approved' || c.status === 'auto_approved' || c.status === 'paid').length;
    const rejectedCount = claims.filter(c => c.status === 'rejected').length;

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Claims', value: activeCount, icon: ClipboardList, color: 'text-primary' },
                        { label: 'Pending Review', value: pendingCount, icon: Clock, color: 'text-accent' },
                        { label: 'Approved', value: approvedCount, icon: CheckCircle, color: 'text-secondary' },
                        { label: 'Rejected', value: rejectedCount, icon: XCircle, color: 'text-destructive' },
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

                {/* Filter */}
                <div className="flex gap-2 flex-wrap">
                    {['all', 'processing', 'approved', 'rejected'].map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize',
                                statusFilter === s ? 'bg-admin text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            )}
                        >
                            {s === 'processing' ? 'Pending' : s}
                        </button>
                    ))}
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-border/50 shadow-sm overflow-hidden animate-fade-in-up">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30">
                                <TableHead className="text-xs">Claim ID</TableHead>
                                <TableHead className="text-xs">Worker</TableHead>
                                <TableHead className="text-xs">City</TableHead>
                                <TableHead className="text-xs">Trigger</TableHead>
                                <TableHead className="text-xs">Amount</TableHead>
                                <TableHead className="text-xs">Status</TableHead>
                                <TableHead className="text-xs">Date</TableHead>
                                <TableHead className="text-xs">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((claim, i) => (
                                <TableRow key={i} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="text-xs font-mono font-medium">#{claim.id}</TableCell>
                                    <TableCell className="text-xs">{claim.full_name}</TableCell>
                                    <TableCell className="text-xs capitalize">{claim.city || 'Unknown'}</TableCell>
                                    <TableCell className="text-xs">{claim.trigger_type}</TableCell>
                                    <TableCell className="text-xs font-medium">{formatCurrency(claim.payout_amount)}</TableCell>
                                    <TableCell>
                                        <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold capitalize', statusStyles[claim.status] || 'bg-muted text-muted-foreground')}>
                                            {claim.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{new Date(claim.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <button
                                            onClick={() => setSelectedClaim(claim)}
                                            className="px-2.5 py-1 rounded-md bg-admin/10 text-admin text-[10px] font-medium hover:bg-admin/20 transition-colors"
                                        >
                                            Review
                                        </button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filtered.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-sm text-muted-foreground">
                                        No claims found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Claim Detail Drawer */}
                <Sheet open={!!selectedClaim} onOpenChange={() => setSelectedClaim(null)}>
                    <SheetContent className="w-full sm:max-w-md">
                        <SheetHeader>
                            <SheetTitle className="text-lg">Claim #{selectedClaim?.id}</SheetTitle>
                            <SheetDescription>Review claim details</SheetDescription>
                        </SheetHeader>
                        {selectedClaim && (
                            <div className="mt-6 space-y-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold">
                                        {selectedClaim?.full_name?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">{selectedClaim.full_name}</p>
                                        <p className="text-xs text-muted-foreground capitalize">{selectedClaim.city || 'Unknown'}</p>
                                    </div>
                                </div>

                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between py-2 border-b border-border/50">
                                        <span className="text-muted-foreground">Trigger</span>
                                        <span className="font-medium">{selectedClaim.trigger_type}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-border/50">
                                        <span className="text-muted-foreground">GPS Validation</span>
                                        <span className="font-medium text-secondary">Active ✅</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-border/50">
                                        <span className="text-muted-foreground">Final Payout</span>
                                        <span className="font-bold text-primary">{formatCurrency(selectedClaim.payout_amount)}</span>
                                    </div>
                                </div>

                                {(selectedClaim.status === 'processing' || selectedClaim.status === 'pending') && (
                                    <div className="flex gap-3 pt-4">
                                        <button
                                            onClick={() => updateClaimStatus(selectedClaim.id, 'approved')}
                                            className="flex-1 py-2.5 rounded-xl bg-secondary text-white text-sm font-semibold hover:bg-secondary/90 transition-colors"
                                        >
                                            ✅ Approve
                                        </button>
                                        <button
                                            onClick={() => updateClaimStatus(selectedClaim.id, 'rejected')}
                                            className="flex-1 py-2.5 rounded-xl bg-destructive text-white text-sm font-semibold hover:bg-destructive/90 transition-colors"
                                        >
                                            ❌ Reject
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </SheetContent>
                </Sheet>
            </div>
        </AdminLayout>
    );
};

export default AdminClaims;