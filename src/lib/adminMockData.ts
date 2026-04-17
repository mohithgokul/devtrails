export const adminKPIs = {
    totalActivePolicies: 1247,
    policyChange: 8.3,
    totalPremiums: 2345000,
    premiumChange: 12.1,
    totalClaimsPaid: 1890000,
    claimsChange: -3.4,
    overallLossRatio: 80.6,
};

export const premiumVsClaims = [
    { month: 'Nov', premiums: 380000, claims: 220000 },
    { month: 'Dec', premiums: 395000, claims: 310000 },
    { month: 'Jan', premiums: 410000, claims: 260000 },
    { month: 'Feb', premiums: 425000, claims: 380000 },
    { month: 'Mar', premiums: 390000, claims: 340000 },
    { month: 'Apr', premiums: 345000, claims: 380000 },
];

export const adminAlerts = [
    { type: 'warning' as const, message: 'Heavy rainfall predicted in Kurnool — 3 active policies at risk' },
    { type: 'critical' as const, message: 'Loss ratio for Crop Flood exceeded 80% this week' },
    { type: 'info' as const, message: '12 new policies enrolled in Guntur district today' },
];

export const lossRatioByProduct = [
    { product: 'Gig Rider — Rain', ratio: 72, premiums: 890000, claims: 640800, trend: [65, 68, 70, 72] },
    { product: 'Gig Rider — Heatwave', ratio: 58, premiums: 620000, claims: 359600, trend: [55, 60, 62, 58] },
    { product: 'Gig Rider — Curfew', ratio: 85, premiums: 410000, claims: 348500, trend: [70, 75, 80, 85] },
    { product: 'Gig Rider — Pollution', ratio: 45, premiums: 425000, claims: 191250, trend: [50, 48, 46, 45] },
];

export const monthlyLossRatio = [
    { month: 'Nov', rain: 65, heat: 55, curfew: 70, pollution: 50 },
    { month: 'Dec', rain: 68, heat: 60, curfew: 75, pollution: 48 },
    { month: 'Jan', rain: 70, heat: 62, curfew: 80, pollution: 46 },
    { month: 'Feb', rain: 72, heat: 58, curfew: 85, pollution: 45 },
    { month: 'Mar', rain: 75, heat: 55, curfew: 82, pollution: 42 },
    { month: 'Apr', rain: 72, heat: 58, curfew: 85, pollution: 45 },
];

export const lossRatioTable = [
    { product: 'Gig Rider — Rain', activePolicies: 342, premiums: 890000, claims: 640800, ratio: 72, status: 'watch' as const },
    { product: 'Gig Rider — Heatwave', activePolicies: 278, premiums: 620000, claims: 359600, ratio: 58, status: 'healthy' as const },
    { product: 'Gig Rider — Curfew', activePolicies: 189, premiums: 410000, claims: 348500, ratio: 85, status: 'critical' as const },
    { product: 'Gig Rider — Pollution', activePolicies: 438, premiums: 425000, claims: 191250, ratio: 45, status: 'healthy' as const },
];

export const districtLossRatio = [
    { district: 'Kurnool', policies: 142, premiums: 485000, claims: 412250, ratio: 85, risk: 'critical' as const },
    { district: 'Guntur', policies: 98, premiums: 340000, claims: 244800, ratio: 72, risk: 'high' as const },
    { district: 'Krishna', policies: 76, premiums: 260000, claims: 166400, ratio: 64, risk: 'medium' as const },
    { district: 'Nellore', policies: 54, premiums: 185000, claims: 92500, ratio: 50, risk: 'low' as const },
    { district: 'Visakhapatnam', policies: 112, premiums: 390000, claims: 257400, ratio: 66, risk: 'medium' as const },
    { district: 'Warangal', policies: 61, premiums: 210000, claims: 163800, ratio: 78, risk: 'high' as const },
    { district: 'Nalgonda', policies: 45, premiums: 155000, claims: 72850, ratio: 47, risk: 'low' as const },
];

export const forecastSummary = {
    predictedClaims: 83,
    estimatedPayout: 23240,
    highRiskDistricts: 3,
    triggerProbability: 72,
    forecastPeriod: 'Apr 16 – Apr 22, 2026',
};

export const dailyForecast = [
    { day: 'Mon', date: 'Apr 16', claims: 8, weather: '☁️', probability: 25 },
    { day: 'Tue', date: 'Apr 17', claims: 15, weather: '🌧️', probability: 65 },
    { day: 'Wed', date: 'Apr 18', claims: 22, weather: '🌧️', probability: 82 },
    { day: 'Thu', date: 'Apr 19', claims: 18, weather: '🌧️', probability: 70 },
    { day: 'Fri', date: 'Apr 20', claims: 10, weather: '⛅', probability: 35 },
    { day: 'Sat', date: 'Apr 21', claims: 6, weather: '☀️', probability: 15 },
    { day: 'Sun', date: 'Apr 22', claims: 4, weather: '☀️', probability: 10 },
];

export const weatherTriggers = [
    { trigger: 'Rainfall', threshold: '> 100mm', forecast: '118mm (Kurnool)', status: 'trigger' as const },
    { trigger: 'Temperature', threshold: '> 42°C', forecast: '39°C', status: 'watch' as const },
    { trigger: 'Wind Speed', threshold: '> 60 km/h', forecast: '45 km/h', status: 'safe' as const },
    { trigger: 'AQI Pollution', threshold: '> 300', forecast: '210', status: 'safe' as const },
    { trigger: 'Curfew/Strike', threshold: 'Announced', forecast: 'None detected', status: 'safe' as const },
];

export const districtRiskForecast = [
    { district: 'Kurnool', activePolicies: 142, predictedClaims: 38, estPayout: 10640, risk: 'critical' as const },
    { district: 'Guntur', activePolicies: 98, predictedClaims: 21, estPayout: 5880, risk: 'high' as const },
    { district: 'Krishna', activePolicies: 76, predictedClaims: 12, estPayout: 3360, risk: 'medium' as const },
    { district: 'Nellore', activePolicies: 54, predictedClaims: 5, estPayout: 1400, risk: 'low' as const },
    { district: 'Warangal', activePolicies: 61, predictedClaims: 9, estPayout: 2520, risk: 'medium' as const },
];

export const recommendedActions = [
    { level: 'critical' as const, text: 'Pre-allocate ₹14,000 reserve for Kurnool district claims this week' },
    { level: 'watch' as const, text: 'Monitor Guntur rainfall — currently at 89mm, 11mm below trigger' },
    { level: 'safe' as const, text: 'No action needed for southern districts this week' },
];

export const adminClaimsKPIs = {
    activeClaims: 47,
    pendingReview: 12,
    approved: 28,
    rejected: 7,
};

export const recentClaims = [
    { id: 'CLM-1042', worker: 'Ravi Kumar', district: 'Kurnool', trigger: 'Rain 🌧️', amount: 280, status: 'processing' as const, date: '2026-04-14' },
    { id: 'CLM-1041', worker: 'Suresh M.', district: 'Guntur', trigger: 'Heat 🔥', amount: 350, status: 'approved' as const, date: '2026-04-13' },
    { id: 'CLM-1040', worker: 'Priya D.', district: 'Nellore', trigger: 'Pollution 🌫️', amount: 200, status: 'paid' as const, date: '2026-04-12' },
    { id: 'CLM-1039', worker: 'Ajay N.', district: 'Warangal', trigger: 'Rain 🌧️', amount: 310, status: 'rejected' as const, date: '2026-04-11' },
    { id: 'CLM-1038', worker: 'Lakshmi P.', district: 'Krishna', trigger: 'Curfew 🚫', amount: 420, status: 'approved' as const, date: '2026-04-10' },
    { id: 'CLM-1037', worker: 'Venkat R.', district: 'Kurnool', trigger: 'Rain 🌧️', amount: 260, status: 'processing' as const, date: '2026-04-10' },
    { id: 'CLM-1036', worker: 'Sita G.', district: 'Visakhapatnam', trigger: 'Heat 🔥', amount: 390, status: 'paid' as const, date: '2026-04-09' },
    { id: 'CLM-1035', worker: 'Ramesh B.', district: 'Guntur', trigger: 'Pollution 🌫️', amount: 180, status: 'processing' as const, date: '2026-04-08' },
];

export const adminPoliciesKPIs = {
    totalActive: 1247,
    newThisMonth: 89,
    renewalsDue: 34,
    cancelled: 12,
};

export const policiesByProduct = [
    { name: 'Rain Coverage', value: 342, color: 'hsl(217 91% 53%)' },
    { name: 'Heat Coverage', value: 278, color: 'hsl(0 84% 60%)' },
    { name: 'Pollution Coverage', value: 438, color: 'hsl(215 16% 47%)' },
    { name: 'Curfew Coverage', value: 189, color: 'hsl(45 93% 58%)' },
];

export const policyTable = [
    { id: 'POL-2301', worker: 'Ravi Kumar', district: 'Kurnool', plan: 'Standard', premium: 185, coverage: 70, startDate: '2026-03-15', status: 'active' as const },
    { id: 'POL-2302', worker: 'Suresh M.', district: 'Guntur', plan: 'Pro', premium: 240, coverage: 85, startDate: '2026-03-10', status: 'active' as const },
    { id: 'POL-2303', worker: 'Priya D.', district: 'Nellore', plan: 'Basic', premium: 120, coverage: 60, startDate: '2026-02-28', status: 'renewal' as const },
    { id: 'POL-2304', worker: 'Ajay N.', district: 'Warangal', plan: 'Standard', premium: 185, coverage: 70, startDate: '2026-03-20', status: 'active' as const },
    { id: 'POL-2305', worker: 'Lakshmi P.', district: 'Krishna', plan: 'Pro', premium: 240, coverage: 85, startDate: '2026-01-15', status: 'cancelled' as const },
];

export const workersKPIs = {
    totalRegistered: 1583,
    activeThisWeek: 1247,
    inactive: 336,
    highRisk: 89,
};

export const workersTable = [
    { name: 'Ravi Kumar', phone: '98765xxxxx', district: 'Kurnool', platform: 'Swiggy', plan: 'Standard', riskScore: 35, claimsFiled: 3, status: 'active' as const },
    { name: 'Suresh M.', phone: '87654xxxxx', district: 'Guntur', platform: 'Zomato', plan: 'Pro', riskScore: 62, claimsFiled: 7, status: 'active' as const },
    { name: 'Priya D.', phone: '76543xxxxx', district: 'Nellore', platform: 'Amazon', plan: 'Basic', riskScore: 28, claimsFiled: 1, status: 'inactive' as const },
    { name: 'Ajay N.', phone: '65432xxxxx', district: 'Warangal', platform: 'Swiggy', plan: 'Standard', riskScore: 78, claimsFiled: 9, status: 'active' as const },
    { name: 'Lakshmi P.', phone: '54321xxxxx', district: 'Krishna', platform: 'Dunzo', plan: 'Pro', riskScore: 45, claimsFiled: 4, status: 'active' as const },
    { name: 'Venkat R.', phone: '43210xxxxx', district: 'Kurnool', platform: 'Blinkit', plan: 'Standard', riskScore: 55, claimsFiled: 5, status: 'active' as const },
];