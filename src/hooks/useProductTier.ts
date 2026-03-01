import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function useProductTier(productId: string) {
  const { user } = useAuth();
  const [tier, setTier] = useState<'free' | 'deluxe'>('free');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      if (!user) {
        setTier('free');
        setIsLoading(false);
        return;
      }
      try {
        const { data: sub } = await supabase
          .from('user_subscriptions')
          .select('tier, subscription_end, payment_type')
          .eq('user_id', user.id)
          .eq('product_id', productId)
          .eq('active', true)
          .maybeSingle();

        if (sub?.tier === 'deluxe') {
          if (!sub.subscription_end) {
            setTier('deluxe');
            setIsLoading(false);
            return;
          }

          const endDate = new Date(sub.subscription_end);
          const now = new Date();
          const isMonthly = sub.payment_type === 'monthly';
          const graceMs = 7 * 24 * 60 * 60 * 1000;
          const withinGrace = now.getTime() - endDate.getTime() <= graceMs;

          if (endDate > now || (isMonthly && withinGrace)) {
            setTier('deluxe');
            setIsLoading(false);
            return;
          }
        }
        setTier('free');
      } catch {
        setTier('free');
      }
      setIsLoading(false);
    };
    check();
  }, [user, productId]);

  return { tier, isLoading };
}
