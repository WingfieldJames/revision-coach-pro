import React, { useState, useEffect } from 'react';
import { Brain, Lock, Loader2, Crown } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface AStarBrainToggleProps {
  isDeluxe: boolean;
  productId?: string;
}

export const AStarBrainToggle: React.FC<AStarBrainToggleProps> = ({ isDeluxe, productId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const STORAGE_KEY = `astar_brain_enabled_${user?.id || 'anon'}`;

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    setEnabled(saved === 'true' && isDeluxe);
    setLoading(false);
  }, [STORAGE_KEY, isDeluxe]);

  const handleToggle = (checked: boolean) => {
    if (!isDeluxe) return;
    setEnabled(checked);
    localStorage.setItem(STORAGE_KEY, String(checked));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Brain className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-base text-foreground">Your A* Brain</h3>
        </div>
        <div className="relative">
          <Switch
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={!isDeluxe}
          />
          {!isDeluxe && (
            <Lock className="h-3 w-3 text-muted-foreground absolute -top-1 -right-1" />
          )}
        </div>
      </div>

      <p className="text-sm text-foreground/80 leading-relaxed">
        The more you use A*AI, the better it knows you.
      </p>
      <p className="text-sm text-foreground/80 leading-relaxed">
        Every conversation builds your personal profile — so your AI tutor always knows your weak spots, your subjects, and where you left off.
      </p>

      {!isDeluxe && (
        <div className="rounded-lg bg-muted/50 border border-border p-3 space-y-2">
          <p className="text-xs text-muted-foreground">
            🔒 Your A* Brain is available exclusively for Deluxe users.
          </p>
          <Button
            variant="brand"
            size="sm"
            className="w-full"
            onClick={() => navigate('/compare')}
          >
            <Crown className="h-3.5 w-3.5 mr-1.5" />
            Upgrade to Deluxe
          </Button>
        </div>
      )}

      {isDeluxe && enabled && (
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
          <p className="text-xs text-primary font-medium">
            ✨ A* Brain is active — your AI gets smarter with every conversation.
          </p>
        </div>
      )}
    </div>
  );
};
