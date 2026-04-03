import { cn } from '@/lib/utils';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

const defaultLabels = ['Basic Info', 'Work Details', 'Location', 'Risk Profile', 'Plan'];

const ProgressBar = ({ currentStep, totalSteps, labels = defaultLabels }: ProgressBarProps) => {
  return (
    <div className="px-4 pt-4 pb-2">
      {/* Progress line */}
      <div className="relative flex items-center justify-between mb-2">
        <div className="absolute left-0 right-0 h-1 bg-muted rounded-full" />
        <div
          className="absolute left-0 h-1 gradient-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${(currentStep / (totalSteps - 1)) * 100}%` }}
        />
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300',
              i <= currentStep
                ? 'gradient-primary text-primary-foreground scale-110'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {i + 1}
          </div>
        ))}
      </div>
      {/* Labels */}
      <div className="flex justify-between">
        {labels.map((label, i) => (
          <span
            key={i}
            className={cn(
              'text-[9px] font-medium text-center w-14 transition-colors',
              i <= currentStep ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;
