/**
 * Single source of truth for what a credit package actually costs and how
 * many credits it grants. Every gateway (Stripe, M-Pesa, PayPal) now
 * accepts ONLY a packageId and looks up price/credits here - never trusts
 * a client-supplied amount or credit count.
 *
 * Previously: Stripe's create-checkout-session accepted `credits` and
 * `price` directly from the request body; PayPal accepted `amountUSD`
 * and `creditHours` directly; M-Pesa accepted `amountKES` and
 * `creditHours` directly. A malicious client could request any amount of
 * credits for any price (including $0.01 for 1000 credits) by editing
 * the request body - the server never checked it against anything.
 *
 * There were also two different, mutually-inconsistent hardcoded package
 * lists on the frontend (UnifiedCheckoutModal.tsx's 4-tier KES/USD list,
 * StripeCheckoutModal.tsx's separate 3-tier USD-only list). This replaces
 * both - the frontend catalog is now for DISPLAY only; the actual charge
 * always comes from this file, server-side.
 */

export interface CreditPackage {
  id: string;
  hours: number;
  priceUSD: number;
  priceKES: number;
  label: string;
  badge?: string;
  popular?: boolean;
  savings?: string;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  { id: 'pkg_starter', hours: 2, priceUSD: 10.0, priceKES: 1300, label: 'Starter Bundle', badge: 'Trial' },
  { id: 'pkg_standard', hours: 5, priceUSD: 24.0, priceKES: 3120, label: 'Standard Bundle', badge: 'Most Popular', popular: true, savings: 'Save 4%' },
  { id: 'pkg_pro', hours: 15, priceUSD: 65.0, priceKES: 8450, label: 'Pro Bundle', badge: 'Best Value', savings: 'Save 13%' },
  { id: 'pkg_master', hours: 30, priceUSD: 120.0, priceKES: 15600, label: 'Master Bundle', badge: 'Power Learner', savings: 'Save 20%' },
];

export function getPackageById(packageId: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find(p => p.id === packageId);
}
