import React, { useState } from 'react';
import { CheckCircle2, XCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSpacedRepetition } from '@/hooks/useSpacedRepetition';
import { toast } from 'sonner';

interface SpacedReviewFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId?: string;
}

export const SpacedReviewFlow: React.FC<SpacedReviewFlowProps> = ({
  open,
  onOpenChange,
  productId,
}) => {
  const { dueReviews, markReviewResult, refreshDueReviews } = useSpacedRepetition(productId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [totalAtStart, setTotalAtStart] = useState(0);
  const [finished, setFinished] = useState(false);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setCurrentIndex(0);
      setShowAnswer(false);
      setAnsweredCount(0);
      setTotalAtStart(dueReviews.length);
      setFinished(false);
    }
  }, [open, dueReviews.length]);

  const currentQuestion = dueReviews.length > 0 ? dueReviews[0] : null;
  const total = totalAtStart || dueReviews.length + answeredCount;

  const handleResult = async (correct: boolean) => {
    if (!currentQuestion) return;

    try {
      await markReviewResult(currentQuestion.id, correct);
      setAnsweredCount(prev => prev + 1);
      setShowAnswer(false);

      if (correct) {
        toast.success('Nice one! Moving on.');
      } else {
        toast.info("No worries — you'll see this again tomorrow.");
      }

      // Check if that was the last one (dueReviews will have been updated by markReviewResult)
      if (dueReviews.length <= 1) {
        setFinished(true);
      }
    } catch {
      toast.error('Something went wrong. Try again.');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    refreshDueReviews();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Spaced Review</DialogTitle>
        </DialogHeader>

        {finished || (!currentQuestion && answeredCount > 0) ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="text-4xl">All caught up!</div>
            <p className="text-muted-foreground">
              You reviewed {answeredCount} {answeredCount === 1 ? 'question' : 'questions'}. Great work!
            </p>
            <Button variant="default" onClick={handleClose}>
              Close
            </Button>
          </div>
        ) : currentQuestion ? (
          <div className="flex flex-col gap-4">
            {/* Progress */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Question {answeredCount + 1} of {total}
              </span>
              <span className="text-xs">
                Stage {currentQuestion.review_count + 1} of 3
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className="bg-gradient-brand h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${((answeredCount) / total) * 100}%` }}
              />
            </div>

            {/* Question card */}
            <Card>
              <CardContent className="pt-6">
                {currentQuestion.question_text && (
                  <p className="text-lg font-medium leading-relaxed">
                    {currentQuestion.question_text}
                  </p>
                )}
                {currentQuestion.question_image_url && (
                  <img
                    src={currentQuestion.question_image_url}
                    alt="Question"
                    className="max-w-full rounded-lg mt-3"
                  />
                )}

                {/* Answer section */}
                {showAnswer && currentQuestion.note && (
                  <div className="mt-4 p-3 bg-muted rounded-lg border">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Your note:</p>
                    <p className="text-sm">{currentQuestion.note}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            {!showAnswer ? (
              <Button variant="outline" onClick={() => setShowAnswer(true)} className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                Show Answer
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleResult(false)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Still struggling
                </Button>
                <Button
                  variant="default"
                  className="flex-1 text-green-600 border-green-200"
                  onClick={() => handleResult(true)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Got it
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <p className="text-muted-foreground">No reviews due right now.</p>
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
