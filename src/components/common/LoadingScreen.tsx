import { useState, useEffect } from 'react';
import riderGif from '@/assets/delivery-rider.gif';

interface LoadingScreenProps {
  messages?: string[];
  onComplete?: () => void;
  duration?: number;
}

const defaultMessages = [
  'Analyzing your risk profile…',
  'Calculating your weekly premium…',
  'Setting up your protection…',
  'Almost ready…',
];

const LoadingScreen = ({ messages = defaultMessages, onComplete, duration = 4000 }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + 1;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => onComplete?.(), 300);
        }
        return Math.min(next, 100);
      });
    }, duration / 100);

    return () => clearInterval(interval);
  }, [duration, onComplete]);

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMsgIndex(prev => (prev + 1) % messages.length);
    }, duration / messages.length);
    return () => clearInterval(msgInterval);
  }, [duration, messages]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      {/* City background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-40 opacity-10">
          {/* Skyline silhouette */}
          <div className="absolute bottom-0 w-full flex items-end justify-around">
            {[60, 90, 50, 110, 70, 85, 45, 100, 55, 80, 65, 95].map((h, i) => (
              <div
                key={i}
                className="bg-foreground/30 rounded-t-sm"
                style={{ width: `${6 + Math.random() * 4}%`, height: `${h}%`, maxHeight: `${h}px` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Rider */}
      <div className="relative mb-12 animate-fade-in-scale">
        <img src={riderGif} alt="Loading" className="w-48 h-48 object-contain" />
      </div>

      {/* Road Progress */}
      <div className="relative w-72 mb-8">
        {/* Road */}
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full gradient-primary rounded-full transition-all duration-300 ease-out relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary-foreground shadow-md" />
          </div>
        </div>
        {/* Dashes */}
        <div className="absolute inset-0 flex items-center justify-around pointer-events-none">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="w-3 h-0.5 bg-foreground/10 rounded" />
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-3 font-medium">{progress}%</p>
      </div>

      {/* Message */}
      <p className="text-sm font-medium text-foreground animate-fade-in-up" key={msgIndex}>
        {messages[msgIndex]}
      </p>
    </div>
  );
};

export default LoadingScreen;
