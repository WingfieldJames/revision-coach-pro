import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { storeReferralCode, getReferralCode, processReferral, clearReferralCode } from './useReferral';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

/**
 * Hook to capture referral codes from URL and process them after signup.
 *
 * Usage: Mount once at app root level (e.g., in App.tsx or a layout component).
 *
 * - On any route change, checks for ?ref=CODE in URL
 * - Stores the code in localStorage as 'pending_referral_code'
 * - When a user becomes authenticated and a pending code exists, processes the referral
 */
export const useReferralCapture = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Step 1: Capture ?ref=CODE from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');

    if (refCode) {
      // Only store if we don't already have this exact code
      const existing = getReferralCode();
      if (existing !== refCode) {
        storeReferralCode(refCode);
        console.log('[REFERRAL-CAPTURE] Referral code captured from URL:', refCode);
      }
    }
  }, [location.search]);

  // Step 2: Process referral after user signs up / signs in
  useEffect(() => {
    const pendingCode = getReferralCode();

    if (user && pendingCode) {
      // Loop 4.2: only redeem for a freshly-created account. Without this, any existing
      // logged-in user could paste a referral link and self-serve another 7 days of
      // premium. A genuine signup redeems within seconds; an established account's
      // created_at is old. (Deeper fix: authenticate process-referral server-side and
      // derive referred_user_id from the JWT — flagged, not done here.)
      const createdAtMs = user.created_at ? new Date(user.created_at).getTime() : 0;
      const isNewAccount = createdAtMs > 0 && Date.now() - createdAtMs < 15 * 60 * 1000;
      if (!isNewAccount) {
        console.log('[REFERRAL-CAPTURE] Existing account — not redeeming referral; clearing code');
        clearReferralCode();
        return;
      }

      console.log('[REFERRAL-CAPTURE] New account with pending referral code:', pendingCode);

      // Small delay to let user creation settle in the DB
      const timer = setTimeout(async () => {
        const success = await processReferral(pendingCode, user.id);
        if (success) {
          toast.success('Welcome! You and your friend both got 7 days of free premium access.');
        } else {
          // Don't show error for already-referred or invalid codes — just clean up silently
          console.log('[REFERRAL-CAPTURE] Referral processing did not succeed, clearing code');
          clearReferralCode();
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [user]);
};
