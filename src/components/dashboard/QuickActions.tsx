import { useNavigate } from 'react-router-dom';
import { FileText, ClipboardList, Calculator, TrendingUp } from 'lucide-react';

const actions = [
  { icon: FileText, label: 'Policy', path: '/policy', color: 'bg-primary/10 text-primary' },
  { icon: ClipboardList, label: 'Claims', path: '/claims', color: 'bg-secondary/10 text-secondary' },
  { icon: Calculator, label: 'Calculate', path: '/calculator', color: 'bg-accent/10 text-accent-foreground' },
  { icon: TrendingUp, label: 'Analytics', path: '/analytics', color: 'bg-destructive/10 text-destructive' },
];

const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map(({ icon: Icon, label, path, color }) => (
        <button
          key={path}
          onClick={() => navigate(path)}
          className="flex flex-col items-center gap-2 p-3 rounded-2xl glass-card hover:scale-105 active:scale-95 transition-all duration-200"
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-medium text-foreground">{label}</span>
        </button>
      ))}
    </div>
  );
};

export default QuickActions;
