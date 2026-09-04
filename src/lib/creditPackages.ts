/**
 * Display-only mirror of server/packageCatalog.ts. Must stay in sync with
 * that file's ids/prices/credits - the server is what actually determines
 * what gets charged and how many credits are granted (it looks packages
 * up by id, never trusts anything computed here). This file exists only
 * so the checkout UI has something to render before the network round
 * trip; if it ever drifts out of sync with the server catalog, the worst
 * case is a confusing price shown to the user, never a wrong charge.
 *
 * Previously there were TWO separate, mutually-inconsistent package
 * lists hardcoded across UnifiedCheckoutModal.tsx and
 * StripeCheckoutModal.tsx. This replaces both.
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
