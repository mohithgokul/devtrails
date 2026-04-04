import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import PremiumCard from '@/components/dashboard/PremiumCard';
import CoverageCard from '@/components/dashboard/CoverageCard';
import RiskGauge from '@/components/dashboard/RiskGauge';
import EarningsChart from '@/components/dashboard/EarningsChart';
import QuickActions from '@/components/dashboard/QuickActions';

interface RiskData {
  riskScore: number;
  riskLevel: string;
  factors: string[];
  riskProbability: number;
}

const Dashboard = () => {
  const [riskData, setRiskData] = useState<RiskData | null>(null);

  useEffect(() => {
    const runAssessment = async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

      try {
        const storedUser = localStorage.getItem('surakshapay_user');
        if (!storedUser) return;

        const { id } = JSON.parse(storedUser);

        // Call the zero-touch assessment endpoint — this runs the full ML pipeline
        // (fetches live signals → risk_model prediction → premium calculation → trigger checks)
        const res = await fetch(`${apiUrl}/api/assess/from_user/${id}`, { method: 'POST' });

        if (res.ok) {
          const data = await res.json();
          console.log('✅ Live ML Assessment:', data);

          // Convert risk_probability (0.0-1.0) to a 0-100 score for the gauge
          setRiskData({
            riskScore: Math.round(data.risk.risk_probability * 100),
            riskLevel: data.risk.risk_level,
            factors: data.risk.contributing_factors,
            riskProbability: data.risk.risk_probability,
          });
        }
      } catch (err) {
        console.error('Failed to run ML assessment:', err);
      }
    };

    runAssessment();
  }, []);

  return (
    <AppLayout>
      <DashboardHeader />
      <div className="px-5 space-y-4 pb-4">
        <div className="animate-fade-in-up"><PremiumCard /></div>
        <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}><QuickActions /></div>
        <div className="grid grid-cols-1 gap-4">
          <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}><CoverageCard /></div>
          <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <RiskGauge riskData={riskData} />
          </div>
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}><EarningsChart /></div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
