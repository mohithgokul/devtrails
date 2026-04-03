import { useState, useCallback } from 'react';

export interface OnboardingData {
  fullName: string;
  phone: string;
  otpVerified: boolean;
  profilePhoto: string | null;
  platforms: string[];
  workHours: number;
  dailyEarnings: number;
  gpsEnabled: boolean;
  activityTracking: boolean;
  notifications: boolean;
  workZones: string[];
  peakHours: string;
  workConditions: string[];
  selectedPlan: string;
  weeklyIncome: number;
  latitude?: number;
  longitude?: number;
  city?: string;
}

const initialData: OnboardingData = {
  fullName: '',
  phone: '',
  otpVerified: false,
  profilePhoto: null,
  platforms: [],
  workHours: 8,
  dailyEarnings: 500,
  gpsEnabled: false,
  activityTracking: false,
  notifications: false,
  workZones: [],
  peakHours: 'morning',
  workConditions: [],
  selectedPlan: 'standard',
  weeklyIncome: 4000,
  latitude: undefined,
  longitude: undefined,
  city: undefined,
};

/**
 * Returns whether the current step's required fields are completed.
 */
function isStepValid(step: number, data: OnboardingData): boolean {
  switch (step) {
    case 0: // Basic Info — name required, phone required & verified
      return data.fullName.trim().length >= 2 && data.phone.length >= 10 && data.otpVerified;
    case 1: // Work Details — at least one platform selected
      return data.platforms.length > 0;
    case 2: // Location & Permissions — GPS must be enabled
      return data.gpsEnabled;
    case 3: // Risk Profile — at least one work zone selected
      return data.workZones.length > 0;
    case 4: // Plan Selection — a plan is always pre-selected, so always valid
      return true;
    default:
      return false;
  }
}

export function useOnboarding() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(initialData);

  const totalSteps = 5;

  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const nextStep = useCallback(() => {
    setStep(prev => Math.min(prev + 1, totalSteps - 1));
  }, []);

  const prevStep = useCallback(() => {
    setStep(prev => Math.max(prev - 1, 0));
  }, []);

  const isFirstStep = step === 0;
  const isLastStep = step === totalSteps - 1;
  const progress = ((step + 1) / totalSteps) * 100;
  const canProceed = isStepValid(step, data);

  return {
    step,
    setStep,
    data,
    updateData,
    nextStep,
    prevStep,
    isFirstStep,
    isLastStep,
    progress,
    totalSteps,
    canProceed,
  };
}
