import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminClaimsKPIs, recentClaims } from '@/lib/adminMockData';
import { formatCurrency } from '@/utils/formatCurrency';
import { cn } from '@/lib/utils';
import { ClipboardList, Clock, CheckCircle, XCircle, X } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

const statusStyles: Record<string, string> = {
    processing: 'bg-accent/10 text-accent-foreground',
    approved: 'bg-secondary/10 text-secondary',
    paid: 'bg-primary/10 text-primary',
    rejected: 'bg-destructive/10 text-destructive',
};

const AdminClaims = () => {
    const [selectedClaim, setSelectedClaim] = useState<(typeof recentClaims)[0] | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const filtered = statusFilter === 'all' ? recentClaims : recentClaims.filter(c => c.status === statusFilter);

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Active Claims', value: adminClaimsKPIs.activeClaims, icon: ClipboardList, color: 'text-primary' },
                        { label: 'Pending Review', value: adminClaimsKPIs.pendingReview, icon: Clock, color: 'text-accent' },
                        { label: 'Approved', value: adminClaimsKPIs.approved, icon: CheckCircle, color: 'text-secondary' },
                        { label: 'Rejected', value: adminClaimsKPIs.rejected, icon: XCircle, color: 'text-destructive' },
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
                    {['all', 'processing', 'approved', 'paid', 'rejected'].map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize',
                                statusFilter === s ? 'bg-admin text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            )}
                        >
                            {s}
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
                                <TableHead className="text-xs">District</TableHead>
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
                                    <TableCell className="text-xs font-mono font-medium">{claim.id}</TableCell>
                                    <TableCell className="text-xs">{claim.worker}</TableCell>
                                    <TableCell className="text-xs">{claim.district}</TableCell>
                                    <TableCell className="text-xs">{claim.trigger}</TableCell>
                                    <TableCell className="text-xs font-medium">{formatCurrency(claim.amount)}</TableCell>
                                    <TableCell>
                                        <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold capitalize', statusStyles[claim.status])}>
                                            {claim.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{claim.date}</TableCell>
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
                        </TableBody>
                    </Table>
                </div>

                {/* Claim Detail Drawer */}
                <Sheet open={!!selectedClaim} onOpenChange={() => setSelectedClaim(null)}>
                    <SheetContent className="w-full sm:max-w-md">
                        <SheetHeader>
                            <SheetTitle className="text-lg">Claim {selectedClaim?.id}</SheetTitle>
                            <SheetDescription>Review claim details</SheetDescription>
                        </SheetHeader>
                        {selectedClaim && (
                            <div className="mt-6 space-y-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold">
                                        {selectedClaim.worker.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">{selectedClaim.worker}</p>
                                        <p className="text-xs text-muted-foreground">{selectedClaim.district}</p>
                                    </div>
                                </div>

                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between py-2 border-b border-border/50">
                                        <span className="text-muted-foreground">Trigger</span>
                                        <span className="font-medium">{selectedClaim.trigger}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-border/50">
                                        <span className="text-muted-foreground">GPS Validation</span>
                                        <span className="font-medium text-secondary">Active ✅</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-border/50">
                                        <span className="text-muted-foreground">Loss Calculation</span>
                                        <span className="font-medium">4h × ₹100/h × 70%</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-border/50">
                                        <span className="text-muted-foreground">Final Payout</span>
                                        <span className="font-bold text-primary">{formatCurrency(selectedClaim.amount)}</span>
                                    </div>
                                </div>

                                {selectedClaim.status === 'processing' && (
                                    <div className="flex gap-3 pt-4">
                                        <button className="flex-1 py-2.5 rounded-xl bg-secondary text-white text-sm font-semibold hover:bg-secondary/90 transition-colors">
                                            Approve
                                        </button>
                                        <button className="flex-1 py-2.5 rounded-xl bg-destructive text-white text-sm font-semibold hover:bg-destructive/90 transition-colors">
                                            Reject
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