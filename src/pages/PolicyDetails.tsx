import AppLayout from '@/components/layout/AppLayout';
import GlassCard from '@/components/layout/GlassCard';
import { userProfile, triggerConditions } from '@/lib/mockData';
import { formatCurrency } from '@/utils/formatCurrency';
import { Shield, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useState } from 'react';

const PolicyDetails = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedSection(prev => prev === id ? null : id);

  const timelineSteps = [
    { label: 'Policy Activated', date: 'Mar 15, 2026', done: true },
    { label: 'First Premium Deducted', date: 'Mar 17, 2026', done: true },
    { label: 'Coverage Period', date: 'Mar 17 – Mar 24', done: true },
    { label: 'Next Renewal', date: 'Mar 24, 2026', done: false },
  ];

  return (
    <AppLayout>
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-foreground mb-1">Policy Details</h1>
        <p className="text-sm text-muted-foreground mb-6">Your current coverage breakdown</p>

        {/* Coverage Overview */}
        <GlassCard variant="gradient" className="mb-4 animate-fade-in-up">
          <div className="flex items-center gap-3">
            <Shield className="w-10 h-10 text-primary-foreground/80" />
            <div>
              <p className="text-primary-foreground/80 text-xs">Active Plan</p>
              <p className="text-2xl font-bold text-primary-foreground">{userProfile.plan} — {userProfile.coverage}%</p>
              <p className="text-xs text-primary-foreground/70">Weekly cap: {formatCurrency(userProfile.weeklyIncome * userProfile.coverage / 100)}</p>
            </div>
          </div>
        </GlassCard>

        {/* Trigger Conditions */}
        <h2 className="text-sm font-semibold text-foreground mb-3">Trigger Conditions</h2>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {triggerConditions.map((tc, i) => (
            <GlassCard key={tc.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` } as React.CSSProperties}>
              <div className="text-2xl mb-2">{tc.icon}</div>
              <p className="text-sm font-semibold text-foreground">{tc.label}</p>
              <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{tc.description}</p>
            </GlassCard>
          ))}
        </div>

        {/* Expandable Sections */}
        <div className="space-y-2 mb-6">
          {[
            { id: 'how', title: 'How It Works', content: 'When a trigger event is detected in your work zone (e.g., heavy rain above 50mm), our system automatically validates your activity data. If you were active during the disruption, a claim is auto-generated and processed within minutes.' },
            { id: 'example', title: 'Example Scenario', content: 'It\'s raining heavily in your delivery zone. You\'re active on Swiggy from 6-10 PM. Our sensors detect 65mm rainfall. Your Standard plan (70% coverage) kicks in. If your normal earning for that period is ₹500, you receive ₹350 as an instant payout.' },
            { id: 'exclusions', title: 'Exclusions', content: 'Claims are not valid if activity tracking was disabled during the event, if you were outside your registered work zones, or if the trigger threshold was not met in your specific area.' },
          ].map(section => (
            <GlassCard key={section.id} onClick={() => toggle(section.id)} className="cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">{section.title}</span>
                </div>
                {expandedSection === section.id ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              {expandedSection === section.id && (
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed animate-fade-in-up">
                  {section.content}
                </p>
              )}
            </GlassCard>
          ))}
        </div>

        {/* Policy Timeline */}
        <h2 className="text-sm font-semibold text-foreground mb-3">Policy Lifecycle</h2>
        <GlassCard>
          <div className="space-y-0">
            {timelineSteps.map((s, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${s.done ? 'gradient-primary' : 'bg-muted border-2 border-border'}`} />
                  {i < timelineSteps.length - 1 && (
                    <div className={`w-0.5 h-8 ${s.done ? 'bg-primary/30' : 'bg-border'}`} />
                  )}
                </div>
                <div className="pb-4">
                  <p className={`text-sm font-medium ${s.done ? 'text-foreground' : 'text-muted-foreground'}`}>{s.label}</p>
                  <p className="text-[10px] text-muted-foreground">{s.date}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </AppLayout>
  );
};

export default PolicyDetails;
