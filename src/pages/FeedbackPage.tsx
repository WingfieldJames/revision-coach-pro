import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export const FeedbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  const feedbackType = searchParams.get('type') === 'deluxe' ? 'deluxe' : 'free';
  const isDeluxe = profile?.is_premium || feedbackType === 'deluxe';

  const [rating, setRating] = useState<number>(0);
  const [hoveredStar, setHoveredStar] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate(`/login?redirect=feedback${feedbackType === 'deluxe' ? '?type=deluxe' : ''}`);
    }
  }, [user, loading, navigate, feedbackType]);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({ title: 'Please select a rating', variant: 'destructive' });
      return;
    }
    if (!user) return;

    setSubmitting(true);
    try {
      const { error } = await (supabase as any)
        .from('user_feedback')
        .insert({
          user_id: user.id,
          rating,
          feedback_text: feedbackText.trim() || null,
          feedback_type: isDeluxe ? 'deluxe' : 'free',
        });

      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      toast({ title: 'Error submitting feedback', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border-border shadow-lg">
        <CardContent className="pt-8 pb-8 px-6 flex flex-col items-center text-center gap-6">
          {/* Logo */}
          <img src="/brand-logo.png" alt="A* AI" className="h-10 w-auto" />

          {submitted ? (
            <>
              <div className="text-5xl">🎉</div>
              <h1 className="text-2xl font-bold text-foreground">Thank you!</h1>
              <p className="text-muted-foreground text-sm">
                Your feedback helps us make A* AI even better.
              </p>
              {isDeluxe ? (
                <Button variant="brand" size="lg" onClick={() => navigate('/compare')}>
                  Back to Chat
                </Button>
              ) : (
                <div className="flex flex-col gap-3 w-full">
                  <Button variant="brand" size="lg" onClick={() => navigate('/compare')}>
                    Upgrade to Deluxe →
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/compare')}>
                    Back to Chat
                  </Button>
                </div>
              )}
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-foreground">
                How's your experience{isDeluxe ? ' with Deluxe' : ''}?
              </h1>
              <p className="text-muted-foreground text-sm">
                We'd love your honest feedback — it takes 30 seconds.
              </p>

              {/* Star Rating */}
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    className="transition-transform hover:scale-110 focus:outline-none"
                  >
                    <Star
                      className={cn(
                        'w-10 h-10 transition-colors',
                        (hoveredStar || rating) >= star
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground/30'
                      )}
                    />
                  </button>
                ))}
              </div>

              {/* Optional text */}
              <Textarea
                placeholder="Tell us more (optional)..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                className="min-h-[100px] resize-none"
                maxLength={1000}
              />

              <Button
                variant="brand"
                size="lg"
                className="w-full"
                onClick={handleSubmit}
                disabled={submitting || rating === 0}
              >
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>

              {/* Upgrade CTA for free users */}
              {!isDeluxe && (
                <div className="border-t border-border pt-4 w-full">
                  <p className="text-sm text-muted-foreground mb-2">
                    Ready to unlock unlimited access?
                  </p>
                  <Button variant="outline" size="sm" onClick={() => navigate('/compare')}>
                    Upgrade to Deluxe →
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
