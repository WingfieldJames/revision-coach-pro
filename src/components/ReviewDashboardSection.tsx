import React, { useState } from 'react';
import { RotateCcw, BookCheck, Clock, Zap } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ReviewDueBadge } from '@/components/ReviewDueBadge';
import { SpacedReviewFlow } from '@/components/SpacedReviewFlow';
import { useSpacedRepetition } from '@/hooks/useSpacedRepetition';

interface ReviewDashboardSectionProps {
  productId?: string;
}

export const ReviewDashboardSection: React.FC<ReviewDashboardSectionProps> = ({ productId }) => {
  const { dueCount, loading, stats } = useSpacedRepetition(productId);
  const [reviewOpen, setReviewOpen] = useState(false);

  const handleStartReview = () => {
    setReviewOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Spaced Review
          </CardTitle>
          <ReviewDueBadge dueCount={dueCount} onClick={handleStartReview} />
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Stats row */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <BookCheck className="h-3.5 w-3.5 text-green-600" />
                  <span className="text-muted-foreground">
                    {stats.mastered} mastered
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-yellow-600" />
                  <span className="text-muted-foreground">
                    {stats.inProgress} in progress
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-red-600" />
                  <span className="text-muted-foreground">
                    {stats.due} due today
                  </span>
                </div>
              </div>

              {/* Action area */}
              {dueCount > 0 ? (
                <Button variant="brand" onClick={handleStartReview} className="w-full">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Start Review ({dueCount} {dueCount === 1 ? 'question' : 'questions'})
                </Button>
              ) : stats.mastered > 0 && stats.inProgress === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  All mastered!
                </p>
              ) : stats.inProgress > 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Next review: check back tomorrow
                </p>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Add mistakes to start reviewing
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <SpacedReviewFlow
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        productId={productId}
      />
    </>
  );
};
