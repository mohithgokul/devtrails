import { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import logo from '@/assets/surakshapay-logo.png';

const DashboardHeader = () => {
  const [userName, setUserName] = useState('User');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('surakshapay_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.name) {
          setUserName(parsed.name.split(' ')[0]); // Use first name
        }
      }
    } catch {
      // fallback to 'User'
    }
  }, []);

  return (
    <div className="px-5 pt-6 pb-4">
      <div className="flex items-center justify-between mb-4">
        <img src={logo} alt="SurakshaPay" className="h-8" />
        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
          {userName[0]}
        </div>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Hi {userName} 👋
        </h1>
        <div className="flex items-center gap-1.5 mt-1">
          <Shield className="w-4 h-4 text-secondary" />
          <span className="text-sm text-secondary font-medium">
            You're protected this week ✅
          </span>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
