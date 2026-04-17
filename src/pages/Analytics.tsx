import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import GlassCard from '@/components/layout/GlassCard';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar } from 'recharts';

type Tab = 'premium' | 'payout' | 'risk';

const Analytics = () => {
  const [tab, setTab] = useState<Tab>('premium');
  const [premiumHistory, setPremiumHistory] = useState<any[]>([]);
  const [riskTrend, setRiskTrend] = useState<any[]>([]);
  const [totalPremium, setTotalPremium] = useState<number>(0);
  const [totalPayout, setTotalPayout] = useState<number>(0);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const storedUser = localStorage.getItem('surakshapay_user');
        if (!storedUser) return;
        
        const { id } = JSON.parse(storedUser);
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        
        const res = await fetch(`${apiUrl}/api/analytics/${id}`);
        if (res.ok) {
          const data = await res.json();
          setPremiumHistory(data.premiumHistory);
          setRiskTrend(data.riskTrend);
          setTotalPremium(data.totalPremium);
          setTotalPayout(data.totalPayout);
        }
      } catch (e) {
        console.error('Failed to fetch analytics:', e);
      }
    };
    fetchAnalytics();
  }, []);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'premium', label: 'Premium' },
    { id: 'payout', label: 'Payouts' },
    { id: 'risk', label: 'Risk Trend' },
  ];

  return (
    <AppLayout>
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-foreground mb-1">Analytics</h1>
        <p className="text-sm text-muted-foreground mb-6">Track your insurance performance</p>

        {/* Tab Selector */}
        <div className="flex gap-2 mb-6">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                tab === t.id
                  ? 'gradient-primary text-primary-foreground shadow-md'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Charts */}
        <GlassCard className="animate-fade-in-up">
          <p className="text-sm font-semibold text-foreground mb-4">
            {tab === 'premium' && 'Premium Paid Over Time'}
            {tab === 'payout' && 'Payouts Received'}
            {tab === 'risk' && 'Risk Score Trend'}
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              {tab === 'premium' ? (
                <LineChart data={premiumHistory}>
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(215 16% 47%)" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(215 16% 47%)" width={35} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="premium" stroke="hsl(217 91% 53%)" strokeWidth={2.5} dot={{ fill: 'hsl(217 91% 53%)', r: 4 }} />
                </LineChart>
              ) : tab === 'payout' ? (
                <BarChart data={premiumHistory}>
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(215 16% 47%)" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(215 16% 47%)" width={35} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                  <Bar dataKey="payout" fill="hsl(142 71% 45%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={riskTrend}>
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(215 16% 47%)" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(215 16% 47%)" width={35} domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="score" stroke="hsl(45 93% 58%)" strokeWidth={2.5} dot={{ fill: 'hsl(45 93% 58%)', r: 4 }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <GlassCard className="text-center animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <p className="text-xs text-muted-foreground">Total Premium</p>
            <p className="text-xl font-bold text-foreground">₹{totalPremium.toLocaleString()}</p>
          </GlassCard>
          <GlassCard className="text-center animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <p className="text-xs text-muted-foreground">Total Payouts</p>
            <p className="text-xl font-bold text-secondary">₹{totalPayout.toLocaleString()}</p>
          </GlassCard>
        </div>
      </div>
    </AppLayout>
  );
};

export default Analytics;
