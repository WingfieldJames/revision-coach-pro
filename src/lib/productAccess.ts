import { supabase } from "@/integrations/supabase/client";

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
  
  // Then check user_subscriptions with the exact product_id
  const { data: subscription, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('product_id', product.id)
    .eq('active', true)
    .maybeSingle();
  
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
