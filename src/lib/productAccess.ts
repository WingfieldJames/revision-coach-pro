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
  // First check new user_subscriptions table
  const { data: subscription, error } = await supabase
    .from('user_subscriptions')
    .select(`
      *,
      product:products(*)
    `)
    .eq('user_id', userId)
    .eq('active', true)
    .eq('product.slug', productSlug)
    .maybeSingle();
  
  if (!error && subscription) {
    // Check if subscription is still valid
    if (subscription.subscription_end) {
      const endDate = new Date(subscription.subscription_end);
      if (endDate < new Date()) {
        return { hasAccess: false, tier: 'free' };
      }
    }
    
    return { 
      hasAccess: true, 
      tier: (subscription.tier === 'deluxe' ? 'deluxe' : 'free') as 'deluxe' | 'free',
      subscription 
    };
  }
  
  // Fallback: Check legacy users table for backwards compatibility
  const { data: user } = await supabase
    .from('users')
    .select('is_premium, subscription_end')
    .eq('id', userId)
    .maybeSingle();
    
  if (user?.is_premium) {
    // Legacy user still has access
    return { 
      hasAccess: true, 
      tier: 'deluxe',
      subscription: { legacy: true } 
    };
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
