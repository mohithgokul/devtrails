import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import GlassCard from '@/components/layout/GlassCard';
import { mockClaims } from '@/lib/mockData';
import { formatCurrency } from '@/utils/formatCurrency';
import { getStatusColor, getStatusLabel } from '@/utils/getStatusColor';
import { cn } from '@/lib/utils';
import { ArrowLeft, CheckCircle2, Clock, AlertCircle, Banknote } from 'lucide-react';

const ClaimDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const claim = mockClaims.find(c => c.id === id);

  if (!claim) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Claim not found</p>
        </div>
      </AppLayout>
    );
  }

  const timelineSteps = [
    { icon: AlertCircle, label: 'Trigger Detected', desc: `${claim.trigger} in your work zone`, done: true },
    { icon: CheckCircle2, label: 'Activity Validated', desc: claim.activityValidated ? 'Work activity confirmed' : 'Pending validation', done: claim.activityValidated },
    { icon: Clock, label: 'Claim Approved', desc: `Loss: ${formatCurrency(claim.lossCalculated)} · Coverage: ${claim.coverageApplied}%`, done: claim.status === 'approved' || claim.status === 'paid' },
    { icon: Banknote, label: 'Payout Sent', desc: `${formatCurrency(claim.amount)} via UPI`, done: claim.status === 'paid' },
  ];

  return (
    <AppLayout>
      <div className="px-5 pt-6 pb-4">
        <button onClick={() => navigate('/claims')} className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Claims
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="text-4xl">{claim.triggerIcon}</div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{claim.trigger}</h1>
            <p className="text-xs text-muted-foreground">{claim.date} · {claim.id}</p>
            <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border mt-1 inline-block', getStatusColor(claim.status))}>
              {getStatusLabel(claim.status)}
            </span>
          </div>
        </div>

        {/* Breakdown */}
        <GlassCard className="mb-4 animate-fade-in-up">
          <h2 className="text-sm font-semibold text-foreground mb-3">Claim Breakdown</h2>
          <div className="space-y-2.5">
            {[
              { label: 'Estimated Loss', value: formatCurrency(claim.lossCalculated) },
              { label: 'Coverage Applied', value: `${claim.coverageApplied}%` },
              { label: 'Final Payout', value: formatCurrency(claim.amount), bold: true },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <span className={cn('text-sm', item.bold ? 'font-bold text-primary' : 'font-medium text-foreground')}>{item.value}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Explanation */}
        <GlassCard className="mb-4 animate-fade-in-up border-l-4 border-l-primary" style={{ animationDelay: '100ms' }}>
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Why this was {claim.status}:</strong>{' '}
            {claim.status === 'paid' || claim.status === 'approved'
              ? `Your activity data confirmed you were working during the ${claim.trigger.toLowerCase()} event. The ${claim.coverageApplied}% coverage from your Standard plan was applied to the estimated loss.`
              : 'Your claim is being validated. We are checking activity data and trigger conditions in your zone.'}
          </p>
        </GlassCard>

        {/* Timeline */}
        <h2 className="text-sm font-semibold text-foreground mb-3">Claim Timeline</h2>
        <GlassCard className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          {timelineSteps.map((s, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                  s.done ? 'gradient-primary' : 'bg-muted'
                )}>
                  <s.icon className={cn('w-4 h-4', s.done ? 'text-primary-foreground' : 'text-muted-foreground')} />
                </div>
                {i < timelineSteps.length - 1 && (
                  <div className={cn('w-0.5 h-10', s.done ? 'bg-primary/30' : 'bg-border')} />
                )}
              </div>
              <div className="pb-4">
                <p className={cn('text-sm font-medium', s.done ? 'text-foreground' : 'text-muted-foreground')}>{s.label}</p>
                <p className="text-[10px] text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </GlassCard>

        {/* Payout Success */}
        {claim.status === 'paid' && (
          <div className="mt-6 text-center animate-fade-in-scale">
            <GlassCard variant="gradient" className="relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][i % 5],
                      animation: `confetti-fall ${2 + Math.random() * 2}s ease-in ${Math.random()}s infinite`,
                      opacity: 0.6,
                    }}
                  />
                ))}
              </div>
              <div className="relative">
                <p className="text-5xl mb-2">🎉</p>
                <p className="text-3xl font-bold text-primary-foreground">{formatCurrency(claim.amount)} Credited</p>
                <p className="text-xs text-primary-foreground/80 mt-2">Instantly via UPI</p>
                <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 text-primary-foreground text-xs font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Transaction Confirmed
                </div>
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ClaimDetail;
