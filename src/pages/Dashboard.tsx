import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import PremiumCard from '@/components/dashboard/PremiumCard';
import CoverageCard from '@/components/dashboard/CoverageCard';
import RiskGauge from '@/components/dashboard/RiskGauge';
import EarningsChart from '@/components/dashboard/EarningsChart';
import QuickActions from '@/components/dashboard/QuickActions';
import SignalsCard from '@/components/dashboard/SignalsCard';

interface RiskData {
  riskScore: number;
  riskLevel: string;
  factors: string[];
  riskProbability: number;
}

interface SignalsData {
  city: string;
  raw_signals: {
    rain: number;
    temp: number;
    aqi: number;
    demand_drop: number;
    curfew: number;
    hourly_income: number;
    daily_hours: number;
  };
  feature_vector: number[];
  sources: {
    weather?: string;
    aqi?: string;
    news?: string;
  };
}

const Dashboard = () => {
  const [riskData, setRiskData] = useState<RiskData | null>(null);
  const [signalsData, setSignalsData] = useState<SignalsData | null>(null);

  useEffect(() => {
    const runAssessment = async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

      try {
        const storedUser = localStorage.getItem('surakshapay_user');
        if (!storedUser) return;

        const storedUserObj = JSON.parse(storedUser);
        const { id } = storedUserObj;

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

          // Capture live signals for the SignalsCard — shows exactly what
          // was fetched from external APIs and sent into the risk_model
          setSignalsData({
            city: data.city ?? '',
            raw_signals: data.raw_signals,
            feature_vector: data.feature_vector,
            sources: data.sources,
          });

          console.log('📡 Live Signals (raw_signals):', data.raw_signals);
          console.log('📊 Feature Vector → risk_model:', data.feature_vector);
          console.log('🔗 API Sources:', data.sources);
        }

        // Add explicit call to /api/assess/signals for network tab visibility
        try {
          const lat = storedUserObj.latitude;
          const lon = storedUserObj.longitude;
          const city = storedUserObj.city;
          const hourlyIncome = storedUserObj.dailyEarnings / storedUserObj.workHours;
          const dailyHours = storedUserObj.workHours;

          let url = `${apiUrl}/api/assess/signals?hourly_income=${hourlyIncome}&daily_hours=${dailyHours}`;
          if (lat && lon) {
            url += `&lat=${lat}&lon=${lon}`;
          } else if (city) {
            url += `&city=${city}`;
          }

          const signalsRes = await fetch(url);
          if (signalsRes.ok) {
            const signalsData = await signalsRes.json();
            console.log(`Live Background Signals (${signalsData.city}):`, signalsData);
          }
        } catch (e) {
          console.log("Could not fetch background signals", e);
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
          {/* Live signals panel — shows raw API data sent to risk_model */}
          <div className="animate-fade-in-up" style={{ animationDelay: '350ms' }}>
            <SignalsCard signalsData={signalsData} />
          </div>
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}><EarningsChart /></div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
