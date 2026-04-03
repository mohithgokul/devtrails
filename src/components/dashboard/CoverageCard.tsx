import GlassCard from '@/components/layout/GlassCard';
import { userProfile } from '@/lib/mockData';
import { Shield } from 'lucide-react';

const CoverageCard = () => {
  return (
    <GlassCard className="flex items-center gap-4">
      <div className="w-14 h-14 rounded-2xl gradient-primary-soft flex items-center justify-center">
        <Shield className="w-7 h-7 text-primary" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Coverage Plan</p>
        <p className="text-lg font-bold text-foreground">{userProfile.plan}</p>
        <p className="text-xs text-secondary font-medium">{userProfile.coverage}% income protected</p>
      </div>
    </GlassCard>
  );
};

export default CoverageCard;
