export const PREMIUM_PLANS = {
  week: { id: 'week', price: 30, label: '$30 Premium — 7 Days', days: 7, envKey: 'NEXT_PUBLIC_SELAR_WEEK_URL' },
  month: { id: 'month', price: 199, label: '$199 Premium — 30 Days', days: 30, envKey: 'NEXT_PUBLIC_SELAR_MONTH_URL' },
  '3months': { id: '3months', price: 399, label: '$399 Premium — 90 Days', days: 90, envKey: 'NEXT_PUBLIC_SELAR_3MONTHS_URL' },
} as const;
export type PremiumPlanId = keyof typeof PREMIUM_PLANS;
