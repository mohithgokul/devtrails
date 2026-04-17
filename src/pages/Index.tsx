import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SplashScreen from '@/components/onboarding/SplashScreen';
import WelcomeScreen from '@/components/onboarding/WelcomeScreen';
import ProgressBar from '@/components/onboarding/ProgressBar';
import StepBasicInfo from '@/components/onboarding/StepBasicInfo';
import StepWorkDetails from '@/components/onboarding/StepWorkDetails';
import StepLocation from '@/components/onboarding/StepLocation';
import StepRiskProfile from '@/components/onboarding/StepRiskProfile';
import StepPlanSelection from '@/components/onboarding/StepPlanSelection';
import LoginScreen from '@/components/onboarding/LoginScreen';
import LoadingScreen from '@/components/common/LoadingScreen';
import { useOnboarding } from '@/hooks/useOnboarding';
import { ArrowLeft, ArrowRight } from 'lucide-react';

type Screen = 'splash' | 'welcome' | 'registration' | 'login' | 'loading';

const Index = () => {
  const [screen, setScreen] = useState<Screen>('splash');
  const navigate = useNavigate();
  const { step, data, updateData, nextStep, prevStep, isFirstStep, isLastStep, totalSteps, canProceed } = useOnboarding();

  const handleSplashComplete = useCallback(() => setScreen('welcome'), []);
  const handleGetStarted = useCallback(() => setScreen('registration'), []);
  const handleLoginNav = useCallback(() => setScreen('login'), []);
  const handleLoadingComplete = useCallback(() => navigate('/dashboard'), [navigate]);

  const handleLoginSuccess = useCallback((userData: any) => {
    localStorage.setItem('surakshapay_user', JSON.stringify({
      id: userData.user_id,
      name: userData.name,
      plan: userData.plan,
      premium: userData.premium,
      role: userData.role,
      token: userData.token,
    }));
    navigate('/dashboard');
  }, [navigate]);

  const handleNext = async () => {
    if (!canProceed) return; // Block if step is incomplete

    if (isLastStep) {
      setScreen('loading');
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        if (res.ok) {
          const result = await res.json();
          // Store user info in localStorage so the dashboard can read it
          localStorage.setItem('surakshapay_user', JSON.stringify({
            id: result.user_id,
            name: data.fullName,
            plan: data.selectedPlan,
            premium: result.premium,
            role: result.role,
            token: result.token,
          }));
        }
      } catch (error) {
        console.error("Failed to register:", error);
      }
    } else {
      nextStep();
    }
  };

  if (screen === 'splash') return <SplashScreen onComplete={handleSplashComplete} />;
  if (screen === 'welcome') return <WelcomeScreen onGetStarted={handleGetStarted} onLogin={handleLoginNav} />;
  if (screen === 'login') return <LoginScreen onLoginSuccess={handleLoginSuccess} onBack={() => setScreen('welcome')} />;
  if (screen === 'loading') return <LoadingScreen onComplete={handleLoadingComplete} />;

  const steps = [
    <StepBasicInfo key={0} data={data} updateData={updateData} />,
    <StepWorkDetails key={1} data={data} updateData={updateData} />,
    <StepLocation key={2} data={data} updateData={updateData} />,
    <StepRiskProfile key={3} data={data} updateData={updateData} />,
    <StepPlanSelection key={4} data={data} updateData={updateData} />,
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="max-w-md mx-auto w-full flex flex-col flex-1">
        <ProgressBar currentStep={step} totalSteps={totalSteps} />
        
        <div className="flex-1 px-5 py-4 overflow-y-auto">
          {steps[step]}
        </div>

        {/* Navigation buttons */}
        <div className="px-5 pb-8 pt-2 flex gap-3">
          {!isFirstStep && (
            <button
              onClick={prevStep}
              className="flex items-center justify-center gap-1 px-5 py-3.5 rounded-xl border-2 border-border text-foreground font-medium text-sm hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className="flex-1 flex items-center justify-center gap-1 py-3.5 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {isLastStep ? 'Complete Setup' : 'Continue'} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Index;
