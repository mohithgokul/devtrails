import AdminLayout from '@/components/admin/AdminLayout';
import { lossRatioByProduct, monthlyLossRatio, lossRatioTable, districtLossRatio } from '@/lib/adminMockData';
import { formatCurrency } from '@/utils/formatCurrency';
import { cn } from '@/lib/utils';
import { Download, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine, Legend } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const statusBadge = (ratio: number) => {
    if (ratio > 80) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-destructive/10 text-destructive">🔴 Critical</span>;
    if (ratio > 60) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent/10 text-accent-foreground">🟡 Watch</span>;
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary/10 text-secondary">🟢 Healthy</span>;
};

const riskBadge = (risk: string) => {
    const styles: Record<string, string> = {
        critical: 'bg-destructive/10 text-destructive',
        high: 'bg-accent/10 text-accent-foreground',
        medium: 'bg-primary/10 text-primary',
        low: 'bg-secondary/10 text-secondary',
    };
    return <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold capitalize', styles[risk])}>{risk}</span>;
};

const LossRatios = () => (
    <AdminLayout>
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-foreground">Loss Ratio Analysis</h1>
                    <p className="text-xs text-muted-foreground">Monitor claims vs premiums by product and district</p>
                </div>
                <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-admin text-white text-xs font-medium hover:bg-admin/90 transition-colors shadow-sm">
                    <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
            </div>

            {/* Product Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {lossRatioByProduct.map((p, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 border border-border/50 shadow-sm animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                        <p className="text-xs font-medium text-muted-foreground mb-2">{p.product}</p>
                        <div className="flex items-end justify-between mb-2">
                            <p className="text-3xl font-bold text-foreground">{p.ratio}%</p>
                            {statusBadge(p.ratio)}
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>Premiums: {formatCurrency(p.premiums)}</span>
                            <span>Claims: {formatCurrency(p.claims)}</span>
                        </div>
                        {/* Mini sparkline */}
                        <div className="flex items-end gap-1 mt-3 h-6">
                            {p.trend.map((v, j) => (
                                <div key={j} className={cn('flex-1 rounded-t', v > 80 ? 'bg-destructive/60' : v > 60 ? 'bg-accent/60' : 'bg-secondary/60')} style={{ height: `${(v / 100) * 100}%` }} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Formula */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3 animate-fade-in-up">
                <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                    <p className="text-sm font-semibold text-foreground">Loss Ratio = (Claims Paid ÷ Premiums Collected) × 100</p>
                    <p className="text-xs text-muted-foreground mt-1">A ratio above 80% indicates unsustainable claims against premiums collected.</p>
                </div>
            </div>

            {/* Monthly Bar Chart */}
            <div className="bg-white rounded-xl p-5 border border-border/50 shadow-sm animate-fade-in-up">
                <h3 className="text-sm font-semibold text-foreground mb-1">Monthly Loss Ratio by Product</h3>
                <p className="text-xs text-muted-foreground mb-4">Last 6 months — 80% threshold marked</p>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyLossRatio} barCategoryGap="20%">
                            <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(215 16% 47%)" />
                            <YAxis tick={{ fontSize: 10 }} stroke="hsl(215 16% 47%)" domain={[0, 120]} />
                            <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '11px' }} />
                            <Legend wrapperStyle={{ fontSize: '11px' }} />
                            <ReferenceLine y={80} stroke="hsl(0 84% 60%)" strokeDasharray="6 3" label={{ value: '80%', position: 'right', fontSize: 10, fill: 'hsl(0 84% 60%)' }} />
                            <Bar dataKey="rain" name="Rain" fill="hsl(217 91% 53%)" radius={[3, 3, 0, 0]} />
                            <Bar dataKey="heat" name="Heat" fill="hsl(0 84% 60%)" radius={[3, 3, 0, 0]} />
                            <Bar dataKey="curfew" name="Curfew" fill="hsl(45 93% 58%)" radius={[3, 3, 0, 0]} />
                            <Bar dataKey="pollution" name="Pollution" fill="hsl(215 16% 47%)" radius={[3, 3, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Loss Ratio Table */}
            <div className="bg-white rounded-xl border border-border/50 shadow-sm overflow-hidden animate-fade-in-up">
                <div className="p-4 border-b border-border/50">
                    <h3 className="text-sm font-semibold text-foreground">Detailed Loss Ratio</h3>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/30">
                            <TableHead className="text-xs">Product Type</TableHead>
                            <TableHead className="text-xs">Active Policies</TableHead>
                            <TableHead className="text-xs">Premiums (₹)</TableHead>
                            <TableHead className="text-xs">Claims (₹)</TableHead>
                            <TableHead className="text-xs">Loss Ratio</TableHead>
                            <TableHead className="text-xs">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {lossRatioTable.map((row, i) => (
                            <TableRow key={i} className={cn(row.ratio > 80 ? 'bg-destructive/5' : row.ratio > 60 ? 'bg-accent/5' : '')}>
                                <TableCell className="text-xs font-medium">{row.product}</TableCell>
                                <TableCell className="text-xs">{row.activePolicies}</TableCell>
                                <TableCell className="text-xs">{formatCurrency(row.premiums)}</TableCell>
                                <TableCell className="text-xs">{formatCurrency(row.claims)}</TableCell>
                                <TableCell className="text-xs font-bold">{row.ratio}%</TableCell>
                                <TableCell>{statusBadge(row.ratio)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* District Table */}
            <div className="bg-white rounded-xl border border-border/50 shadow-sm overflow-hidden animate-fade-in-up">
                <div className="p-4 border-b border-border/50">
                    <h3 className="text-sm font-semibold text-foreground">Loss Ratio by District</h3>
                    <p className="text-xs text-muted-foreground">Andhra Pradesh & Telangana</p>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/30">
                            <TableHead className="text-xs">District</TableHead>
                            <TableHead className="text-xs">Policies</TableHead>
                            <TableHead className="text-xs">Premiums (₹)</TableHead>
                            <TableHead className="text-xs">Claims (₹)</TableHead>
                            <TableHead className="text-xs">Loss Ratio</TableHead>
                            <TableHead className="text-xs">Risk Level</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {districtLossRatio.map((row, i) => (
                            <TableRow key={i} className={cn(row.risk === 'critical' ? 'bg-destructive/5' : row.risk === 'high' ? 'bg-accent/5' : '')}>
                                <TableCell className="text-xs font-medium">{row.district}</TableCell>
                                <TableCell className="text-xs">{row.policies}</TableCell>
                                <TableCell className="text-xs">{formatCurrency(row.premiums)}</TableCell>
                                <TableCell className="text-xs">{formatCurrency(row.claims)}</TableCell>
                                <TableCell className="text-xs font-bold">{row.ratio}%</TableCell>
                                <TableCell>{riskBadge(row.risk)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    </AdminLayout>
);

export default LossRatios;