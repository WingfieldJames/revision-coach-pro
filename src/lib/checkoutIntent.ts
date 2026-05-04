export type CheckoutPaymentType = 'monthly' | 'lifetime';

export interface CheckoutIntent {
  productId?: string | null;
  productSlug?: string | null;
  paymentType: CheckoutPaymentType;
  qualificationType?: 'A Level' | 'GCSE' | string | null;
  premiumPath?: string | null;
  createdAt: number;
}

const KEY = 'pending-checkout-intent';
const MAX_AGE_MS = 60 * 60 * 1000;

export const saveCheckoutIntent = (intent: Omit<CheckoutIntent, 'createdAt'>) => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...intent, createdAt: Date.now() }));
  } catch {}
};

export const getCheckoutIntent = (): CheckoutIntent | null => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CheckoutIntent;
    if (!parsed?.createdAt || Date.now() - parsed.createdAt > MAX_AGE_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    if (!parsed.productId && !parsed.productSlug) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const clearCheckoutIntent = () => {
  try { localStorage.removeItem(KEY); } catch {}
};
