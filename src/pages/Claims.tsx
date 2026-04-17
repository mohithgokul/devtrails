import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import GlassCard from '@/components/layout/GlassCard';
import { mockClaims } from '@/lib/mockData';
import { formatCurrency } from '@/utils/formatCurrency';
import { getStatusColor, getStatusLabel } from '@/utils/getStatusColor';
import { cn } from '@/lib/utils';
import { ChevronRight, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';

type Tab = 'active' | 'past';

const getFraudBadge = (decision?: string, score?: number) => {
  if (!decision || score === undefined) return null;
  const pct = Math.round(score * 100);

  if (decision === 'APPROVED') {
    return {
      icon: ShieldCheck,
      label: `${pct}% Clean`,
      color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    };
  }
  if (decision === 'HOLD') {
    return {
      icon: ShieldAlert,
      label: `${pct}% Risk`,
      color: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    };
  }
  // BLOCKED
  return {
    icon: ShieldX,
    label: `${pct}% Fraud`,
    color: 'text-red-400 bg-red-400/10 border-red-400/30',
  };
};

const Claims = () => {
  const [tab, setTab] = useState<Tab>('active');
  const navigate = useNavigate();

  const activeClaims = mockClaims.filter(c => c.status === 'processing' || c.status === 'approved');
  const pastClaims = mockClaims.filter(c => c.status === 'paid');
  const displayClaims = tab === 'active' ? activeClaims : pastClaims;

  return (
    <AppLayout>
      <div className="px-5 pt-6 pb-4">
        <div className="flex justify-between items-center mb-1">
          <h1 className="text-2xl font-bold text-foreground">Claims</h1>
          <button 
            onClick={() => navigate('/claims/file')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-bold"
          >
            <span className="text-lg leading-none">+</span> File Claim
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-6">Track your insurance claims</p>

        {/* Tab */}
        <div className="flex gap-2 mb-6">
          {(['active', 'past'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                tab === t
                  ? 'gradient-primary text-primary-foreground shadow-md'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {t === 'active' ? 'Active Claims' : 'Past Claims'}
            </button>
          ))}
        </div>

        {/* Claims List */}
        <div className="space-y-3">
          {displayClaims.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm">No {tab} claims</p>
            </div>
          ) : (
            displayClaims.map((claim, i) => {
              const fraudBadge = getFraudBadge(claim.fraud_decision, claim.fraud_score);
              const FraudIcon = fraudBadge?.icon;

              return (
                <GlassCard
                  key={claim.id}
                  onClick={() => navigate(`/claims/${claim.id}`)}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${i * 100}ms` } as React.CSSProperties}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{claim.triggerIcon}</div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{claim.trigger}</p>
                        <p className="text-[10px] text-muted-foreground">{claim.date} · {claim.id}</p>
                        {/* Fraud badge & Trust score inline */}
                        {fraudBadge && FraudIcon && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className={cn(
                              'inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                              fraudBadge.color
                            )}>
                              <FraudIcon className="w-3 h-3" />
                              {fraudBadge.label}
                            </span>
                            {claim.trust_score !== undefined && (
                              <span className="text-[10px] text-muted-foreground">
                                Trust: <strong className="text-foreground">{claim.trust_score}/100</strong>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">{formatCurrency(claim.amount)}</p>
                        <span className={cn(
                          'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                          getStatusColor(claim.status)
                        )}>
                          {getStatusLabel(claim.status)}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </GlassCard>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Claims;
