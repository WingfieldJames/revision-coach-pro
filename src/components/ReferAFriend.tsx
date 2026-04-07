import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Copy, Check, Gift, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { generateReferralCode, getMyReferrals, ReferralStats } from '@/hooks/useReferral';

const REFERRAL_BASE_URL = 'https://astarai.co.uk';

export const ReferAFriend: React.FC = () => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;

    const init = async () => {
      setLoading(true);
      try {
        const [code, referralStats] = await Promise.all([
          generateReferralCode(user.id),
          getMyReferrals(user.id),
        ]);
        setReferralCode(code);
        setStats(referralStats);
      } catch (error) {
        console.error('[REFER] Failed to load referral data:', error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [user]);

  const referralLink = referralCode ? `${REFERRAL_BASE_URL}?ref=${referralCode}` : '';

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleWhatsAppShare = () => {
    if (!referralLink) return;
    const message = encodeURIComponent(
      `Hey! I've been using Astar AI for my revision and it's been super helpful. Use my link to get 7 days of free premium access: ${referralLink}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gift className="h-5 w-5" />
            Refer a Friend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gift className="h-5 w-5" />
          Refer a Friend
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Value proposition */}
        <p className="text-sm text-muted-foreground">
          Give a friend <span className="font-semibold text-foreground">7 days free</span>, get{' '}
          <span className="font-semibold text-foreground">7 days free</span>. Share your unique
          link below.
        </p>

        {/* Referral link */}
        {referralCode && (
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm font-mono truncate">
              {referralLink}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              className="shrink-0"
              aria-label="Copy referral link"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="brand"
            className="flex-1"
            onClick={handleWhatsAppShare}
            disabled={!referralCode}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share on WhatsApp
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleCopy}
            disabled={!referralCode}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
        </div>

        {/* Stats */}
        {stats && stats.totalReferred > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{stats.totalReferred}</span>{' '}
              {stats.totalReferred === 1 ? 'friend' : 'friends'} referred
            </span>
          </div>
        )}

        {/* Referral list */}
        {stats && stats.referrals.length > 0 && (
          <div className="space-y-2 pt-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Your Referrals
            </p>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {stats.referrals
                .filter((r) => r.status === 'completed')
                .map((referral) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between text-sm py-1"
                  >
                    <span className="text-muted-foreground">
                      {new Date(referral.completed_at || referral.created_at).toLocaleDateString(
                        'en-GB',
                        { day: 'numeric', month: 'short' }
                      )}
                    </span>
                    <Badge
                      variant="default"
                      className="bg-green-500/10 text-green-600 hover:bg-green-500/10 border-green-500/20"
                    >
                      Completed
                    </Badge>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
