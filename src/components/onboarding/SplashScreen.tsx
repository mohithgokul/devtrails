import { useEffect, useState } from 'react';
import logo from '@/assets/surakshapay-logo.png';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gradient-primary animate-gradient">
      <div className={`transition-all duration-1000 ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
        <img src={logo} alt="SurakshaPay" className="w-64 h-auto drop-shadow-2xl" />
      </div>
      <p
        className={`mt-6 text-primary-foreground/90 text-lg font-medium tracking-wide transition-all duration-1000 delay-500 ${
          show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        Protecting Every Ride, Every Day
      </p>
      <div className="absolute bottom-12 flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-primary-foreground/50 animate-pulse"
            style={{ animationDelay: `${i * 200}ms` }}
          />
        ))}
      </div>
    </div>
  );
};

export default SplashScreen;
