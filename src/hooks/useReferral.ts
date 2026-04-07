import { supabase } from '@/integrations/supabase/client';

const REFERRAL_STORAGE_KEY = 'pending_referral_code';

/**
 * Get a stored referral code from localStorage.
 */
export const getReferralCode = (): string | null => {
  try {
    return localStorage.getItem(REFERRAL_STORAGE_KEY);
  } catch {
    return null;
  }
};

/**
 * Clear the stored referral code from localStorage.
 */
export const clearReferralCode = (): void => {
  try {
    localStorage.removeItem(REFERRAL_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
};

/**
 * Store a referral code in localStorage for processing after signup.
 */
export const storeReferralCode = (code: string): void => {
  try {
    localStorage.setItem(REFERRAL_STORAGE_KEY, code);
    console.log('[REFERRAL] Code stored:', code);
  } catch {
    console.error('[REFERRAL] Failed to store referral code');
  }
};

/**
 * Generate a unique referral code for a user.
 * Creates a new referral record with status 'pending' if one doesn't already exist.
 * Returns the referral code.
 */
export const generateReferralCode = async (userId: string): Promise<string | null> => {
  try {
    // Check if user already has a referral code
    const { data: existing } = await supabase
      .from('referrals')
      .select('referral_code')
      .eq('referrer_id', userId)
      .eq('status', 'pending')
      .limit(1)
      .maybeSingle();

    if (existing?.referral_code) {
      return existing.referral_code;
    }

    // Generate a short, readable code: first 8 chars of a UUID-like random string
    const code = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();

    const { data, error } = await supabase
      .from('referrals')
      .insert({
        referrer_id: userId,
        referral_code: code,
        status: 'pending',
      })
      .select('referral_code')
      .single();

    if (error) {
      console.error('[REFERRAL] Failed to generate code:', error);
      return null;
    }

    return data.referral_code;
  } catch (error) {
    console.error('[REFERRAL] Error generating referral code:', error);
    return null;
  }
};

export interface ReferralStats {
  totalReferred: number;
  completedReferrals: number;
  pendingReferrals: number;
  referrals: Array<{
    id: string;
    referral_code: string;
    status: string;
    created_at: string;
    completed_at: string | null;
  }>;
}

/**
 * Fetch referral stats for a user.
 */
export const getMyReferrals = async (userId: string): Promise<ReferralStats> => {
  try {
    const { data, error } = await supabase
      .from('referrals')
      .select('id, referral_code, status, created_at, completed_at')
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[REFERRAL] Failed to fetch referrals:', error);
      return { totalReferred: 0, completedReferrals: 0, pendingReferrals: 0, referrals: [] };
    }

    const referrals = data || [];
    const completedReferrals = referrals.filter((r) => r.status === 'completed').length;
    const pendingReferrals = referrals.filter((r) => r.status === 'pending').length;

    return {
      totalReferred: completedReferrals,
      completedReferrals,
      pendingReferrals,
      referrals,
    };
  } catch (error) {
    console.error('[REFERRAL] Error fetching referrals:', error);
    return { totalReferred: 0, completedReferrals: 0, pendingReferrals: 0, referrals: [] };
  }
};

/**
 * Process a referral after signup by calling the edge function.
 */
export const processReferral = async (referralCode: string, referredUserId: string): Promise<boolean> => {
  try {
    console.log('[REFERRAL] Processing referral:', { referralCode, referredUserId });

    const { data, error } = await supabase.functions.invoke('process-referral', {
      body: {
        referral_code: referralCode,
        referred_user_id: referredUserId,
      },
    });

    if (error) {
      console.error('[REFERRAL] Edge function error:', error);
      return false;
    }

    if (data?.success) {
      console.log('[REFERRAL] Referral processed successfully');
      clearReferralCode();
      return true;
    }

    console.error('[REFERRAL] Processing failed:', data?.error);
    return false;
  } catch (error) {
    console.error('[REFERRAL] Unexpected error processing referral:', error);
    return false;
  }
};
