import { earningsData } from '@/lib/mockData';
import GlassCard from '@/components/layout/GlassCard';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const EarningsChart = () => {
  return (
    <GlassCard>
      <p className="text-sm font-semibold text-foreground mb-3">Earnings vs Protected Income</p>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={earningsData} barCategoryGap="20%">
            <XAxis dataKey="week" tick={{ fontSize: 10 }} stroke="hsl(215 16% 47%)" />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(215 16% 47%)" width={35} />
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                fontSize: '12px',
              }}
              formatter={(value: number) => [`₹${value}`, '']}
            />
            <Bar dataKey="earnings" fill="hsl(217 91% 53%)" radius={[4, 4, 0, 0]} name="Earnings" />
            <Bar dataKey="protected" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} name="Protected" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
};

export default EarningsChart;
