import { useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import PremiumCard from '@/components/dashboard/PremiumCard';
import CoverageCard from '@/components/dashboard/CoverageCard';
import RiskGauge from '@/components/dashboard/RiskGauge';
import EarningsChart from '@/components/dashboard/EarningsChart';
import QuickActions from '@/components/dashboard/QuickActions';

const Dashboard = () => {
  // PROOF OF LIFE: Silently hit the backend AI signals endpoint when Dashboard loads.
  // Now uses true dynamic Geolocation to send lat/lon to the backend, which reverse-geocodes it!
  useEffect(() => {
    const fetchSignals = async (lat?: number, lon?: number) => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      let userHourlyIncome = 100;
      let userDailyHours = 8;
      let userCity = 'Bangalore';
      
      try {
        const storedUser = localStorage.getItem('surakshapay_user');
        if (storedUser) {
          const { id } = JSON.parse(storedUser);
          const dashboardRes = await fetch(`${apiUrl}/api/dashboard/${id}`);
          if (dashboardRes.ok) {
            const dashboardData = await dashboardRes.json();
            if (dashboardData && dashboardData.user) {
              const { daily_earnings, work_hours, city } = dashboardData.user;
              userDailyHours = work_hours || 8;
              userHourlyIncome = daily_earnings && work_hours ? daily_earnings / work_hours : 100;
              userCity = city || 'Bangalore';
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch user dashboard data:', err);
      }
      
      // We format userHourlyIncome to 2 decimal places to keep the URL clean
      const formattedIncome = Number(userHourlyIncome).toFixed(2);
      
      const url = lat && lon 
        ? `${apiUrl}/api/assess/signals?lat=${lat}&lon=${lon}&hourly_income=${formattedIncome}&daily_hours=${userDailyHours}`
        : `${apiUrl}/api/assess/signals?city=${encodeURIComponent(userCity)}&hourly_income=${formattedIncome}&daily_hours=${userDailyHours}`; // Fallback
        
      fetch(url)
        .then(res => res.json())
        .then(data => console.log(`✅ Live Background Signals (${data.city}):`, data))
        .catch(err => console.error('Failed to fetch signals:', err));
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchSignals(pos.coords.latitude, pos.coords.longitude),
        () => fetchSignals() // Fallback if user blocks location
      );
    } else {
      fetchSignals();
    }
  }, []);

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
