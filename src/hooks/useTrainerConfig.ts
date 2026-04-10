import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ExamDate } from '@/components/ExamCountdown';

interface TrainerConfig {
  selected_features: string[];
  suggested_prompts: Array<{ text: string; usesPersonalization?: boolean }>;
  essay_marker_marks: number[];
  exam_dates: ExamDate[];
  diagram_library: Array<{ id: string; title: string; imagePath: string }>;
  trainer_name: string | null;
  trainer_status: string | null;
  trainer_description: string | null;
  trainer_image_url: string | null;
  trainer_achievements: Array<{ text: string }>;
  grade_boundaries_data: Record<string, Record<string, number>> | null;
  loaded: boolean;
}

const defaultConfig: TrainerConfig = {
  selected_features: [],
  suggested_prompts: [],
  essay_marker_marks: [],
  exam_dates: [],
  diagram_library: [],
  trainer_name: null,
  trainer_status: null,
  trainer_description: null,
  trainer_image_url: null,
  trainer_achievements: [],
  grade_boundaries_data: null,
  loaded: false,
};

/**
 * Loads trainer configuration (features, prompts, essay marks, exam dates, diagrams)
 * from trainer_projects for any product ID. Returns overrides when available,
 * allowing legacy pages to merge with their hardcoded defaults.
 */
export function useTrainerConfig(productId: string | null | undefined): TrainerConfig {
  const [config, setConfig] = useState<TrainerConfig>(defaultConfig);

  useEffect(() => {
    if (!productId) return;

    const load = async () => {
      try {
        const { data } = await supabase
          .from('trainer_projects')
          .select('selected_features, suggested_prompts, essay_marker_marks, exam_dates, diagram_library, trainer_name, trainer_status, trainer_description, trainer_image_url, trainer_achievements, grade_boundaries_data')
          .eq('product_id', productId)
          .maybeSingle();

        if (data) {
          const features = Array.isArray(data.selected_features) ? (data.selected_features as string[]) : [];
          const prompts = Array.isArray(data.suggested_prompts)
            ? (data.suggested_prompts as Array<{ text: string; usesPersonalization?: boolean }>).filter(p => p.text?.trim())
            : [];
          const marks = Array.isArray(data.essay_marker_marks) ? (data.essay_marker_marks as number[]) : [];
          const examDates: ExamDate[] = (Array.isArray(data.exam_dates) ? data.exam_dates : [])
            .filter((d: any) => d.name && d.date)
            .map((d: any) => ({ name: d.name, date: new Date(d.date), description: d.description || '' }));
          const diagrams = Array.isArray(data.diagram_library)
            ? (data.diagram_library as Array<{ id: string; title: string; imagePath: string }>)
            : [];

          // Parse trainer achievements - handle both {text: string} objects and plain strings
          const rawAchievements = Array.isArray(data.trainer_achievements) ? data.trainer_achievements : [];
          const achievements: Array<{ text: string }> = rawAchievements
            .map((a: any) => (typeof a === 'string' ? { text: a } : a))
            .filter((a: any) => a?.text?.trim());

          // Resolve trainer image URL (handle storage paths and local asset paths)
          let resolvedImageUrl: string | null = (data.trainer_image_url as string) || null;
          if (resolvedImageUrl) {
            if (resolvedImageUrl.startsWith('/src/assets/') || resolvedImageUrl.startsWith('src/assets/')) {
              // Local dev asset path — resolve dynamically via Vite
              const assetName = resolvedImageUrl.replace(/^\/?(src\/assets\/)/, '');
              try {
                const modules = import.meta.glob('/src/assets/*', { eager: true, import: 'default' }) as Record<string, string>;
                const key = `/src/assets/${assetName}`;
                resolvedImageUrl = modules[key] || null;
              } catch {
                resolvedImageUrl = null;
              }
            } else if (!resolvedImageUrl.startsWith('http') && !resolvedImageUrl.startsWith('/')) {
              // trainer-uploads is a public bucket, use getPublicUrl for reliable access
              const { data: publicUrlData } = supabase.storage
                .from('trainer-uploads')
                .getPublicUrl(resolvedImageUrl);
              resolvedImageUrl = publicUrlData?.publicUrl || null;
            }
          }

          const gbData = (data as any).grade_boundaries_data as Record<string, Record<string, number>> | null;

          setConfig({
            selected_features: features,
            suggested_prompts: prompts,
            essay_marker_marks: marks,
            exam_dates: examDates,
            diagram_library: diagrams,
            trainer_name: (data.trainer_name as string) || null,
            trainer_status: (data.trainer_status as string) || null,
            trainer_description: (data.trainer_description as string) || null,
            trainer_image_url: resolvedImageUrl,
            trainer_achievements: achievements,
            grade_boundaries_data: gbData || null,
            loaded: true,
          });
        } else {
          setConfig({ ...defaultConfig, loaded: true });
        }
      } catch (e) {
        console.error('Error loading trainer config:', e);
        setConfig({ ...defaultConfig, loaded: true });
      }
    };

    load();
  }, [productId]);

  return config;
}

/**
 * Helper: returns true if a feature is enabled in trainer config,
 * falling back to the hardcoded default when trainer config has no features set.
 */
export function resolveFeature(
  trainerConfig: TrainerConfig,
  featureId: string,
  hardcodedDefault: boolean
): boolean {
  // If trainer config has features configured, use them
  if (trainerConfig.loaded && trainerConfig.selected_features.length > 0) {
    return trainerConfig.selected_features.includes(featureId);
  }
  // Otherwise fall back to hardcoded default
  return hardcodedDefault;
}
