export const platforms = [
  { id: 'swiggy', name: 'Swiggy', icon: '🟠' },
  { id: 'zomato', name: 'Zomato', icon: '🔴' },
  { id: 'amazon', name: 'Amazon', icon: '📦' },
  { id: 'flipkart', name: 'Flipkart', icon: '🛒' },
  { id: 'dunzo', name: 'Dunzo', icon: '🏃' },
  { id: 'blinkit', name: 'Blinkit', icon: '⚡' },
];

export const workConditions = [
  { id: 'rain', label: 'Rain', icon: '🌧️' },
  { id: 'night', label: 'Night Shifts', icon: '🌙' },
  { id: 'heat', label: 'Extreme Heat', icon: '🔥' },
  { id: 'long_distance', label: 'Long Distance', icon: '🛣️' },
  { id: 'traffic', label: 'Heavy Traffic', icon: '🚗' },
  { id: 'pollution', label: 'High Pollution', icon: '🌫️' },
];

export const workZones = [
  'Central City', 'Suburbs', 'Industrial Area', 'Highway Routes', 'Market Area', 'Residential',
];

export const plans = [
  {
    id: 'basic',
    name: 'Basic',
    coverage: 60,
    color: 'primary' as const,
    features: ['Weather disruption coverage', 'Basic accident cover', 'Weekly payouts'],
    premiumMultiplier: 0.04,
  },
  {
    id: 'standard',
    name: 'Standard',
    coverage: 70,
    color: 'secondary' as const,
    popular: true,
    features: ['All Basic features', 'Pollution & curfew cover', 'Priority claims', 'Activity tracking bonus'],
    premiumMultiplier: 0.06,
  },
  {
    id: 'pro',
    name: 'Pro',
    coverage: 85,
    color: 'primary' as const,
    features: ['All Standard features', 'Maximum coverage', 'Instant payouts', 'Dedicated support', 'Family cover add-on'],
    premiumMultiplier: 0.08,
  },
];

export const triggerConditions = [
  { id: 'rain', label: 'Heavy Rain', icon: '🌧️', description: 'Triggered when rainfall exceeds 50mm in your work zone' },
  { id: 'heat', label: 'Extreme Heat', icon: '🔥', description: 'Triggered when temperature exceeds 42°C' },
  { id: 'pollution', label: 'High Pollution', icon: '🌫️', description: 'Triggered when AQI exceeds 300 in your area' },
  { id: 'curfew', label: 'Curfew/Lockdown', icon: '🚫', description: 'Triggered during government-imposed restrictions' },
];

export const mockClaims = [
  {
    id: 'CLM001',
    trigger: 'Heavy Rain',
    triggerIcon: '🌧️',
    date: '2026-03-20',
    status: 'paid' as const,
    amount: 280,
    activityValidated: true,
    coverageApplied: 70,
    lossCalculated: 400,
    fraud_score: 0.08,
    trust_score: 92,
    fraud_decision: 'APPROVED',
    fraud_type_suspected: 'CLEAN',
    fraud_flags: [],
  },
  {
    id: 'CLM002',
    trigger: 'Extreme Heat',
    triggerIcon: '🔥',
    date: '2026-03-18',
    status: 'approved' as const,
    amount: 350,
    activityValidated: true,
    coverageApplied: 70,
    lossCalculated: 500,
    fraud_score: 0.31,
    trust_score: 69,
    fraud_decision: 'HOLD',
    fraud_type_suspected: 'GPS_SPOOFING',
    fraud_flags: ['GPS vs cell tower gap: 45.2 km (moderate suspicion)'],
  },
  {
    id: 'CLM003',
    trigger: 'High Pollution',
    triggerIcon: '🌫️',
    date: '2026-03-15',
    status: 'processing' as const,
    amount: 200,
    activityValidated: false,
    coverageApplied: 70,
    lossCalculated: 285,
    fraud_score: 0.74,
    trust_score: 26,
    fraud_decision: 'BLOCKED',
    fraud_type_suspected: 'FAKE_WEATHER',
    fraud_flags: ['Rain discrepancy: claimed 62.0, actual 0.5', 'AQI discrepancy: claimed 320.0, actual 72.0'],
  },
];

export const earningsData = [
  { week: 'W1', earnings: 4200, protected: 2940 },
  { week: 'W2', earnings: 3800, protected: 2660 },
  { week: 'W3', earnings: 5100, protected: 3570 },
  { week: 'W4', earnings: 2900, protected: 2030 },
  { week: 'W5', earnings: 4600, protected: 3220 },
  { week: 'W6', earnings: 3500, protected: 2450 },
];

export const premiumHistory = [
  { month: 'Jan', premium: 180, payout: 0 },
  { month: 'Feb', premium: 195, payout: 280 },
  { month: 'Mar', premium: 170, payout: 350 },
  { month: 'Apr', premium: 185, payout: 0 },
  { month: 'May', premium: 200, payout: 420 },
  { month: 'Jun', premium: 175, payout: 200 },
];

export const userProfile = {
  name: 'Ravi',
  plan: 'Standard',
  coverage: 70,
  weeklyPremium: 185,
  nextDeduction: '2026-03-25',
  riskScore: 35,
  weeklyIncome: 4500,
  protectedIncome: 3150,
  isProtected: true,
};
