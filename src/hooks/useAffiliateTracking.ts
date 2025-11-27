import { useEffect } from 'react';

const AFFILIATE_STORAGE_KEY = 'affiliate_referral';
const ATTRIBUTION_WINDOW_DAYS = 30;

interface AffiliateData {
  code: string;
  timestamp: number;
}

export const useAffiliateTracking = () => {
  useEffect(() => {
    // Check for affiliate parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    
    if (refCode) {
      // Store affiliate code with timestamp
      const affiliateData: AffiliateData = {
        code: refCode,
        timestamp: Date.now()
      };
      localStorage.setItem(AFFILIATE_STORAGE_KEY, JSON.stringify(affiliateData));
      console.log('Affiliate referral captured:', refCode);
    }
  }, []);
};

export const getValidAffiliateCode = (): string | null => {
  try {
    const stored = localStorage.getItem(AFFILIATE_STORAGE_KEY);
    if (!stored) return null;
    
    const affiliateData: AffiliateData = JSON.parse(stored);
    const daysSinceReferral = (Date.now() - affiliateData.timestamp) / (1000 * 60 * 60 * 24);
    
    // Check if within 30-day attribution window
    if (daysSinceReferral <= ATTRIBUTION_WINDOW_DAYS) {
      return affiliateData.code;
    } else {
      // Clear expired affiliate data
      localStorage.removeItem(AFFILIATE_STORAGE_KEY);
      return null;
    }
  } catch (error) {
    console.error('Error retrieving affiliate code:', error);
    return null;
  }
};
