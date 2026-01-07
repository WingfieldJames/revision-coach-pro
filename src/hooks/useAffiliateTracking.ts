import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';

const AFFILIATE_STORAGE_KEY = 'affiliate_referral';
const ATTRIBUTION_WINDOW_DAYS = 30;

interface AffiliateData {
  code: string;
  timestamp: number;
}

export const useAffiliateTracking = (showToast = false) => {
  const location = useLocation();
  
  useEffect(() => {
    // Check for affiliate parameter in URL on every route change
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    
    if (refCode) {
      // Check if we already have this code stored
      const existing = localStorage.getItem(AFFILIATE_STORAGE_KEY);
      let shouldUpdate = !existing;
      
      if (existing) {
        try {
          const parsed: AffiliateData = JSON.parse(existing);
          // Only update if code is different
          shouldUpdate = parsed.code !== refCode;
        } catch {
          shouldUpdate = true;
        }
      }
      
      if (shouldUpdate) {
        // Store affiliate code with timestamp
        const affiliateData: AffiliateData = {
          code: refCode,
          timestamp: Date.now()
        };
        localStorage.setItem(AFFILIATE_STORAGE_KEY, JSON.stringify(affiliateData));
        console.log('[AFFILIATE] Referral code captured:', refCode, 'at', new Date().toISOString());
        
        // Optional toast for debugging (can disable in production)
        if (showToast) {
          toast.success(`Referral link activated: ${refCode}`);
        }
      } else {
        console.log('[AFFILIATE] Referral code already stored:', refCode);
      }
    }
  }, [location.search, showToast]); // Re-run when URL search params change
};

export const getValidAffiliateCode = (): string | null => {
  try {
    const stored = localStorage.getItem(AFFILIATE_STORAGE_KEY);
    if (!stored) {
      console.log('[AFFILIATE] No stored affiliate code found');
      return null;
    }
    
    const affiliateData: AffiliateData = JSON.parse(stored);
    const daysSinceReferral = (Date.now() - affiliateData.timestamp) / (1000 * 60 * 60 * 24);
    
    console.log('[AFFILIATE] Found stored code:', affiliateData.code, 
      '| Days since referral:', daysSinceReferral.toFixed(1),
      '| Valid:', daysSinceReferral <= ATTRIBUTION_WINDOW_DAYS);
    
    // Check if within 30-day attribution window
    if (daysSinceReferral <= ATTRIBUTION_WINDOW_DAYS) {
      return affiliateData.code;
    } else {
      // Clear expired affiliate data
      console.log('[AFFILIATE] Code expired, clearing');
      localStorage.removeItem(AFFILIATE_STORAGE_KEY);
      return null;
    }
  } catch (error) {
    console.error('[AFFILIATE] Error retrieving affiliate code:', error);
    return null;
  }
};

// Debug function to check current affiliate state
export const debugAffiliateState = (): void => {
  const stored = localStorage.getItem(AFFILIATE_STORAGE_KEY);
  console.log('[AFFILIATE-DEBUG] Raw localStorage:', stored);
  
  if (stored) {
    try {
      const data = JSON.parse(stored);
      const daysSince = (Date.now() - data.timestamp) / (1000 * 60 * 60 * 24);
      console.log('[AFFILIATE-DEBUG] Parsed data:', {
        code: data.code,
        capturedAt: new Date(data.timestamp).toISOString(),
        daysSinceCapture: daysSince.toFixed(2),
        isValid: daysSince <= ATTRIBUTION_WINDOW_DAYS
      });
    } catch (e) {
      console.log('[AFFILIATE-DEBUG] Parse error:', e);
    }
  } else {
    console.log('[AFFILIATE-DEBUG] No affiliate data stored');
  }
};
