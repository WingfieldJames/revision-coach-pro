import React from 'react';
import { RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ReviewDueBadgeProps {
  dueCount: number;
  onClick: () => void;
}

export const ReviewDueBadge: React.FC<ReviewDueBadgeProps> = ({ dueCount, onClick }) => {
  if (dueCount === 0) return null;

  return (
    <Badge
      variant="destructive"
      className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 text-sm"
      onClick={onClick}
    >
      <RotateCcw className="h-3.5 w-3.5" />
      {dueCount} {dueCount === 1 ? 'question' : 'questions'} to review
    </Badge>
  );
};
