import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from './BottomNav';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('surakshapay_user');
    if (!userData) {
      navigate('/');
    } else {
      try {
        const parsed = JSON.parse(userData);
        if (parsed.role !== 'worker' || !parsed.token) {
          navigate('/');
        }
      } catch {
        navigate('/');
      }
    }
  }, [navigate]);

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
