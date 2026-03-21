import React, { useState, useEffect } from 'react';
import { GraduationCap, Loader2, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TrainerInfoViewerProps {
  productId?: string;
}

interface TrainerData {
  trainer_name: string | null;
  trainer_status: string | null;
  trainer_description: string | null;
  trainer_image_url: string | null;
  trainer_achievements: any[] | null;
}

export const TrainerInfoViewer: React.FC<TrainerInfoViewerProps> = ({ productId }) => {
  const [trainer, setTrainer] = useState<TrainerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrainer = async () => {
      if (!productId) { setLoading(false); return; }
      try {
        const { data } = await supabase
          .from('trainer_projects')
          .select('trainer_name, trainer_status, trainer_description, trainer_image_url, trainer_achievements')
          .eq('product_id', productId)
          .eq('status', 'deployed')
          .maybeSingle();
        
        if (data?.trainer_name) {
          setTrainer({ ...data, trainer_achievements: Array.isArray(data.trainer_achievements) ? data.trainer_achievements : [] } as TrainerData);
          // Resolve image URL
          if (data.trainer_image_url) {
            if (data.trainer_image_url.startsWith('/') || data.trainer_image_url.startsWith('http')) {
              setImageUrl(data.trainer_image_url);
            } else {
              const { data: signedData } = await supabase.storage
                .from('trainer-uploads')
                .createSignedUrl(data.trainer_image_url, 3600);
              setImageUrl(signedData?.signedUrl || null);
            }
          }
        }
      } catch {
        setTrainer(null);
      }
      setLoading(false);
    };
    fetchTrainer();
  }, [productId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!trainer) {
    return (
      <div className="text-center py-6">
        <GraduationCap className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No trainer info available.</p>
      </div>
    );
  }

  const achievements = Array.isArray(trainer.trainer_achievements)
    ? trainer.trainer_achievements.filter((a: any) => a && a.text)
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={trainer.trainer_name || 'Trainer'}
            className="h-16 w-16 rounded-xl object-cover border border-border"
          />
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-foreground">{trainer.trainer_name}</h4>
          {trainer.trainer_status && (
            <p className="text-xs text-muted-foreground">{trainer.trainer_status}</p>
          )}
          {achievements.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {achievements.slice(0, 3).map((a: any, i: number) => (
                <span
                  key={i}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20"
                >
                  {a.text}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {trainer.trainer_description && (
        <div className="rounded-lg bg-muted/50 border border-border p-3">
          <p className="text-sm text-foreground/80 italic leading-relaxed">
            "{trainer.trainer_description}"
          </p>
        </div>
      )}
    </div>
  );
};
