import riderGif from '@/assets/delivery-rider.gif';
import { Shield, Zap, Heart } from 'lucide-react';

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

const WelcomeScreen = ({ onGetStarted, onLogin }: WelcomeScreenProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12">
        <div className="relative mb-8 animate-fade-in-up">
          <div className="w-64 h-64 rounded-full gradient-primary-soft flex items-center justify-center">
            <img src={riderGif} alt="Delivery Rider" className="w-56 h-56 object-contain animate-float" />
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-40 h-4 bg-foreground/5 rounded-full blur-md" />
        </div>

        <h1 className="text-3xl font-bold text-foreground text-center mb-3 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          Secure Your <span className="text-gradient-primary">Income</span>
        </h1>
        <p className="text-muted-foreground text-center text-sm leading-relaxed max-w-xs animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          AI-powered parametric insurance designed for gig delivery workers. Get protected against weather, pollution, and disruptions.
        </p>

        {/* Feature badges */}
        <div className="flex gap-3 mt-8 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
          {[
            { icon: Shield, label: 'Instant Cover' },
            { icon: Zap, label: 'Auto Claims' },
            { icon: Heart, label: 'Fair Pricing' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl glass-card">
              <Icon className="w-5 h-5 text-primary" />
              <span className="text-[10px] font-medium text-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-10 animate-fade-in-up" style={{ animationDelay: '800ms' }}>
        <button
          onClick={onGetStarted}
          className="w-full py-4 rounded-2xl gradient-primary text-primary-foreground font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.98]"
        >
          Create New Account
        </button>
        
        <button
          onClick={onLogin}
          className="w-full py-3.5 mt-3 rounded-2xl bg-accent text-accent-foreground font-semibold text-base border border-border shadow-sm hover:bg-accent/80 transition-all duration-300 active:scale-[0.98]"
        >
          Already have an account? <b>Log In</b>
        </button>
        
        <p className="text-center text-xs text-muted-foreground mt-4">
          Join 50,000+ protected riders across India
        </p>
      </div>
    </div>
  );
};

export default WelcomeScreen;
