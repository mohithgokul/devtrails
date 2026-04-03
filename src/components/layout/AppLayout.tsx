import { ReactNode } from 'react';
import BottomNav from './BottomNav';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto min-h-screen safe-bottom">
        {children}
      </div>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
