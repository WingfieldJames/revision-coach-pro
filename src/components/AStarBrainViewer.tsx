import React, { useState, useEffect } from 'react';
import { Brain, Loader2, Crown, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface AStarBrainViewerProps {
  isDeluxe: boolean;
}

export const AStarBrainViewer: React.FC<AStarBrainViewerProps> = ({ isDeluxe }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) { setLoading(false); return; }
      try {
        const { data } = await supabase
          .from('user_brain_profiles' as any)
          .select('profile_summary')
          .eq('user_id', user.id)
          .maybeSingle();
        setProfile((data as any)?.profile_summary || null);
      } catch {
        setProfile(null);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  if (!user) {
    return (
      <div className="text-center py-8">
        <Brain className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Log in to view your A* Brain profile.</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/login')}>
          Log In
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Non-deluxe: blurred view
  if (!isDeluxe) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Every conversation builds your personal profile over time — so your AI tutor always knows your weak spots, your subjects, and exactly where you left off.
        </p>
        <div className="relative">
          <div className="blur-sm select-none pointer-events-none space-y-2 text-sm text-foreground/70 leading-relaxed">
            <p>Subjects: Economics (Edexcel), Mathematics (Edexcel), Chemistry (AQA)</p>
            <p>Weak areas: Market structures analysis, Integration by parts, Organic mechanisms</p>
            <p>Grade target: A* across all subjects</p>
            <p>Study patterns: Prefers past paper practice, asks for step-by-step walkthroughs</p>
            <p>Progress: Improving on essay technique, needs more work on evaluation paragraphs</p>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 rounded-lg">
            <Lock className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm font-semibold text-foreground mb-1">Deluxe Feature</p>
            <p className="text-xs text-muted-foreground mb-3">Upgrade to unlock your personalized brain profile</p>
            <Button variant="brand" size="sm" onClick={() => navigate('/compare')}>
              <Crown className="h-3.5 w-3.5 mr-1.5" />
              Upgrade to Deluxe
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Brain className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg text-foreground">Your A* Brain</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Everything A*AI understands about you from your conversations.
      </p>
      {profile ? (
        <div className="rounded-lg bg-muted/50 border border-border p-4">
          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{profile}</p>
        </div>
      ) : (
        <div className="rounded-lg bg-muted/50 border border-border p-6 text-center">
          <Brain className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No profile built yet.</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Start chatting and your A* Brain will learn about you automatically.</p>
        </div>
      )}
    </div>
  );
};
