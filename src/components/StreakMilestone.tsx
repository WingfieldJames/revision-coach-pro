import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface StreakMilestoneProps {
  streak: number;
  open: boolean;
  onClose: () => void;
}

const MILESTONE_CONFIG: Record<number, { emoji: string; message: string }> = {
  7: {
    emoji: '🎉',
    message: 'One full week of studying! You are building an incredible habit that will carry you through your exams.',
  },
  14: {
    emoji: '🌟',
    message: 'Two weeks of consistent revision! Your dedication is truly impressive. Keep this momentum going!',
  },
  30: {
    emoji: '🏆',
    message: 'A whole month of daily study! You are in the top tier of dedicated learners. This kind of commitment leads to top grades.',
  },
  60: {
    emoji: '💎',
    message: 'Two months of daily revision! Your commitment is extraordinary. You are setting yourself up for incredible results.',
  },
  100: {
    emoji: '👑',
    message: '100 days of study! You are an absolute revision legend. This level of dedication is truly rare and inspiring.',
  },
};

export function StreakMilestone({ streak, open, onClose }: StreakMilestoneProps) {
  const config = MILESTONE_CONFIG[streak];

  if (!config) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader className="items-center">
          <div className="text-6xl mb-4">{config.emoji}</div>
          <DialogTitle className="text-2xl font-bold">
            Amazing! {streak} day streak!
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground pt-2">
            {config.message}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center pt-4">
          <Button onClick={onClose} className="bg-gradient-brand text-white px-8">
            Keep going!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
