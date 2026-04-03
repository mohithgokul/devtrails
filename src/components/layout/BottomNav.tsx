import { useLocation, useNavigate } from 'react-router-dom';
import { Home, FileText, Calculator, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/dashboard', label: 'Home', icon: Home },
  { path: '/policy', label: 'Policy', icon: FileText },
  { path: '/calculator', label: 'Calculate', icon: Calculator },
  { path: '/claims', label: 'Claims', icon: ClipboardList },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card-strong border-t border-border/50 rounded-none">
      <div className="max-w-md mx-auto flex justify-around items-center py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all duration-200',
                isActive
                  ? 'text-primary scale-105'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className={cn('w-5 h-5', isActive && 'drop-shadow-sm')} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-primary animate-fade-in-scale" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
