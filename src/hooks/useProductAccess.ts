import { useQuery, type QueryClient } from '@tanstack/react-query';
import { checkProductAccess, type ProductAccess } from '@/lib/productAccess';
import { useAuth } from '@/contexts/AuthContext';

// React Query wrapper around the (Sacred, untouched) checkProductAccess.
// Goal: stop re-checking access on every route mount / dashboard burst.
// The query key is scoped by userId, so a different account can never read
// another user's cached entitlement — no cross-user bleed, no AuthContext change.

const STALE_MS = 60_000; // 60s: dedups per-session route churn. The Stripe return is a
// full-page redirect (empty cache) + explicit invalidateProductAccess, so caching cannot
// cause a post-purchase stale-deny. Expiry direction is covered by productAccess's 7-day grace.

const FREE: ProductAccess = { hasAccess: false, tier: 'free' };

const PRODUCT_ACCESS_KEY = 'productAccess';

// Single source of truth for the key + fn so the reactive hook and the imperative
// fetchProductAccess() below share one cache entry (cross-component dedup).
export const productAccessQueryOptions = (
  userId: string | undefined,
  productSlug: string | undefined,
) => ({
  queryKey: [PRODUCT_ACCESS_KEY, userId, productSlug] as const,
  queryFn: () => checkProductAccess(userId as string, productSlug as string),
  staleTime: STALE_MS,
  enabled: !!userId && !!productSlug,
});

// Reactive access check for a single product slug. Drop-in for the
// useEffect + setState(checkProductAccess(...)) pattern in UI components.
export function useProductAccess(productSlug: string | undefined) {
  const { user } = useAuth();
  const query = useQuery(productAccessQueryOptions(user?.id, productSlug));
  return {
    access: query.data ?? FREE,
    hasAccess: query.data?.hasAccess ?? false,
    tier: query.data?.tier ?? 'free',
    isDeluxe: (query.data?.hasAccess && query.data?.tier === 'deluxe') ?? false,
    isChecking: query.isLoading,
  };
}

// Imperative access check for load()/navigate() flows. Shares the cache with the
// hook above, so a gate check and a component check for the same slug collapse to
// one round-trip and don't re-fire on revisit within staleTime.
export async function fetchProductAccess(
  queryClient: QueryClient,
  userId: string,
  productSlug: string,
): Promise<ProductAccess> {
  return queryClient.fetchQuery(productAccessQueryOptions(userId, productSlug));
}

// Drop all cached access after a payment/entitlement change so the next check re-fetches.
export function invalidateProductAccess(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: [PRODUCT_ACCESS_KEY] });
}
