import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'strong' | 'gradient';
  onClick?: () => void;
  style?: React.CSSProperties;
}

const GlassCard = ({ children, className, variant = 'default', onClick, style }: GlassCardProps) => {
  const variants = {
    default: 'glass-card',
    strong: 'glass-card-strong',
    gradient: 'gradient-primary text-primary-foreground',
  };

  return (
    <div
      onClick={onClick}
      style={style}
      className={cn(
        'rounded-2xl p-5 transition-all duration-300',
        variants[variant],
        onClick && 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]',
        className
      )}
    >
      {children}
    </div>
  );
};

export default GlassCard;
