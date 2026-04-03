import AppLayout from '@/components/layout/AppLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import PremiumCard from '@/components/dashboard/PremiumCard';
import CoverageCard from '@/components/dashboard/CoverageCard';
import RiskGauge from '@/components/dashboard/RiskGauge';
import EarningsChart from '@/components/dashboard/EarningsChart';
import QuickActions from '@/components/dashboard/QuickActions';

const Dashboard = () => {
  return (
    <AppLayout>
      <DashboardHeader />
      <div className="px-5 space-y-4 pb-4">
        <div className="animate-fade-in-up"><PremiumCard /></div>
        <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}><QuickActions /></div>
        <div className="grid grid-cols-1 gap-4">
          <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}><CoverageCard /></div>
          <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}><RiskGauge /></div>
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}><EarningsChart /></div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
