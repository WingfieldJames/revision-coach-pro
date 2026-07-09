import { supabase } from "@/integrations/supabase/client";

// Products that grant access to other products (child -> parents that also grant access)
const BUNDLED_SLUGS: Record<string, string[]> = {
  'edexcel-mathematics-applied': ['edexcel-mathematics'],
};

export interface ProductAccess {
  hasAccess: boolean;
  tier: 'free' | 'deluxe';
  subscription?: any;
}

export const checkProductAccess = async (
  userId: string, 
  productSlug: string
): Promise<ProductAccess> => {
  // First get the product ID from the slug
  const { data: product } = await supabase
    .from('products')
    .select('id')
    .eq('slug', productSlug)
    .eq('active', true)
    .maybeSingle();
    
  if (!product) {
    return { hasAccess: false, tier: 'free' };
  }
  
  // Then check user_subscriptions with the exact product_id.
  // Loop 3.5: a user can end up with >1 active row for a product (referral dupes,
  // re-purchase, data drift). The old `.maybeSingle()` errored on >1 row and DENIED a
  // paying customer. Instead fetch all active rows and pick the most favourable —
  // a null end (perpetual) first, otherwise the furthest-out subscription_end.
  const { data: subscriptions, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('product_id', product.id)
    .eq('active', true)
    .order('subscription_end', { ascending: false, nullsFirst: true });

  const subscription = (subscriptions ?? [])[0] ?? null;

  if (!error && subscription) {
    // Check if subscription is still valid
    if (subscription.subscription_end) {
      const endDate = new Date(subscription.subscription_end);
      const now = new Date();

      // Safety net for webhook delays: keep monthly users active for 7 days grace.
      if (endDate < now) {
        const isMonthly = subscription.payment_type === 'monthly';
        const graceMs = 7 * 24 * 60 * 60 * 1000;
        const withinGrace = now.getTime() - endDate.getTime() <= graceMs;

        if (!isMonthly || !withinGrace) {
          return { hasAccess: false, tier: 'free' };
        }
      }
    }
    
    return { 
      hasAccess: true, 
      tier: (subscription.tier === 'deluxe' ? 'deluxe' : 'free') as 'deluxe' | 'free',
      subscription 
    };
  }
  
  // Bundle fallback: check if a parent product grants access
  const parentSlugs = BUNDLED_SLUGS[productSlug];
  if (parentSlugs) {
    for (const parentSlug of parentSlugs) {
      const parentAccess = await checkProductAccess(userId, parentSlug);
      if (parentAccess.hasAccess) {
        return {
          hasAccess: true,
          tier: parentAccess.tier,
          subscription: parentAccess.subscription,
        };
      }
    }
  }
  
  // School-license access: a student on an active school seat gets deluxe access
  // to the licensed product. Additive — every B2C path above is untouched. Mirrors
  // the server-side check in rag-chat so client and server grant access as a pair.
  const { data: memberships } = await supabase
    .from('school_members')
    .select('license_id')
    .eq('user_id', userId)
    .eq('invite_status', 'accepted');

  const licenseIds = (memberships ?? [])
    .map((m) => m.license_id)
    .filter((id): id is string => !!id);

  if (licenseIds.length) {
    const { data: licenses } = await supabase
      .from('school_licenses')
      .select('school_id, expires_at, product_id')
      .in('id', licenseIds)
      .eq('active', true);

    const now = new Date();
    const match = (licenses ?? []).find(
      (l) =>
        (!l.expires_at || new Date(l.expires_at) >= now) &&
        (!l.product_id || l.product_id === product.id),
    );
    if (match) {
      return { hasAccess: true, tier: 'deluxe', subscription: { school: true, school_id: match.school_id } };
    }
  }

  // Fallback: Check legacy users table for backwards compatibility (Edexcel only)
  if (productSlug === 'edexcel-economics') {
    const { data: user } = await supabase
      .from('users')
      .select('is_premium, subscription_end')
      .eq('id', userId)
      .maybeSingle();
      
    if (user?.is_premium) {
      // Check if subscription is still valid
      if (user.subscription_end) {
        const endDate = new Date(user.subscription_end);
        if (endDate < new Date()) {
          return { hasAccess: false, tier: 'free' };
        }
      }
      return { 
        hasAccess: true, 
        tier: 'deluxe',
        subscription: { legacy: true } 
      };
    }
  }
  
  return { hasAccess: false, tier: 'free' };
};

export const getUserProducts = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select(`
      *,
      product:products(*)
    `)
    .eq('user_id', userId)
    .eq('active', true)
    .order('created_at', { ascending: false });
    
  return { products: data || [], error };
};
