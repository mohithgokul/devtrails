import GlassCard from '@/components/layout/GlassCard';
import { userProfile } from '@/lib/mockData';
import { formatCurrency } from '@/utils/formatCurrency';
import { Calendar, CreditCard } from 'lucide-react';

const PremiumCard = () => {
  return (
    <GlassCard variant="gradient" className="relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="w-4 h-4 text-primary-foreground/80" />
          <span className="text-xs font-medium text-primary-foreground/80">Weekly Premium</span>
        </div>
        <p className="text-3xl font-bold text-primary-foreground">{formatCurrency(userProfile.weeklyPremium)}</p>
        <div className="flex items-center gap-1.5 mt-2 text-primary-foreground/70">
          <Calendar className="w-3.5 h-3.5" />
          <span className="text-xs">Next deduction: {userProfile.nextDeduction}</span>
        </div>
      </div>
    </GlassCard>
  );
};

export default PremiumCard;
