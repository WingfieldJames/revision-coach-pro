// This file provides a dynamic "Meet the Brain" section for trainer-deployed subjects
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Quote, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { FounderSection } from '@/components/ui/founder-section';

interface DynamicFounderSectionProps {
  productId: string;
  subjectLabel: string;
  fallbackSubject?: string;
  fallbackExamBoard?: string;
}

export function DynamicFounderSection({ productId, subjectLabel, fallbackSubject, fallbackExamBoard }: DynamicFounderSectionProps) {
  const [trainerImageUrl, setTrainerImageUrl] = useState<string | null>(null);
  const [trainerDescription, setTrainerDescription] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('trainer_projects')
        .select('trainer_image_url, trainer_description')
        .eq('product_id', productId)
        .maybeSingle();
      if (data) {
        setTrainerDescription(data.trainer_description);
        if (data.trainer_image_url) {
          const { data: signed } = await supabase.storage
            .from('trainer-uploads')
            .createSignedUrl(data.trainer_image_url, 3600);
          if (signed?.signedUrl) setTrainerImageUrl(signed.signedUrl);
        }
      }
      setLoading(false);
    };
    load();
  }, [productId]);

  if (loading) return null;
  if (!trainerDescription) {
    if (fallbackSubject) {
      return <FounderSection subject={fallbackSubject as any} examBoard={fallbackExamBoard as any} />;
    }
    return null;
  }

  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
  };

  return (
    <section className="py-16 px-6 bg-gradient-to-br from-muted/50 via-background to-muted/30">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
        >
          <h2 className="text-2xl md:text-3xl font-bold flex items-center justify-center gap-3 flex-wrap">
            <span>Meet the brain behind</span>
            <img
              src="/lovable-uploads/0dc58ad9-fc2a-47f7-82fb-dfc3a3839383.png"
              alt="A* AI"
              className="h-6 md:h-8 inline-block"
            />
            <span className="bg-gradient-brand bg-clip-text text-transparent">{subjectLabel}</span>
          </h2>
        </motion.div>

        <motion.div
          className="relative bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl rounded-3xl border border-border/50 p-8 md:p-12 overflow-hidden shadow-elevated"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 rounded-3xl" />
          <div className="absolute top-8 right-8 opacity-10 hidden md:block">
            <Quote className="w-16 h-16 text-foreground" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
            {trainerImageUrl && (
              <div className="flex-shrink-0">
                <motion.div className="relative" whileHover={{ scale: 1.05 }} transition={{ duration: 0.3 }}>
                  <div className="w-40 h-40 md:w-48 md:h-48 rounded-2xl overflow-hidden border-4 border-primary/20 shadow-lg bg-muted">
                    <img src={trainerImageUrl} alt="Trainer" className="w-full h-full object-cover" />
                  </div>
                  <motion.div
                    className="absolute -inset-2 border-2 border-primary/20 rounded-2xl"
                    animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                </motion.div>
              </div>
            )}

            <div className="flex-1 text-center md:text-left">
              <blockquote className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8">
                "{trainerDescription}"
              </blockquote>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
