import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import henryLi from '@/assets/henry-li.jpg';
import jamesFounder from '@/assets/james-founder.png';
import tanujKakumani from '@/assets/tanuj-kakumani.jpg';

interface Trainer {
  id: string;
  name: string;
  university: string;
  stats: string;
  image: string | null;
  storageKey?: string;
}

const STORAGE_PATHS: Record<string, string> = {
  naman: '6bd8c73c-249f-4b08-b03d-7b857bab7831/trainer_image_1772193739946_Screenshot 2026-02-27 at 12.01.41.png',
  zoya: '8b5b3c36-34ad-44b2-b73c-414d18fefe8a/trainer_image_1772194171764_Screenshot 2026-02-27 at 12.08.42.png',
  yan: '2f504dd8-a94a-492b-94a4-3e46f8264dd8/trainer_image_1772189725122_tudor profile pic .jpg',
  tudor: '7539dc96-eb2e-45be-b5b0-6957dde51974/trainer_image_1772049746995_Screenshot 2026-02-25 at 15.41.22.png',
};

const trainersData: Trainer[] = [
  {
    id: 'naman',
    name: 'Naman Tiwari',
    university: 'Imperial Offer Holder',
    stats: 'A-Level: A*A*A*A* · 8.9 TMUA · Straight 9s',
    image: null,
    storageKey: 'naman',
  },
  {
    id: 'zoya',
    name: 'Zoya Siddiqui',
    university: 'BSc Medicine at UCL',
    stats: 'A-Level: A*A*AA · Straight 9s at GCSE',
    image: null,
    storageKey: 'zoya',
  },
  {
    id: 'henry',
    name: 'Henry Li',
    university: 'LSE PPE',
    stats: 'A-Level: A*A*A*A* · GCSE: 11 9s',
    image: henryLi,
  },
  {
    id: 'james',
    name: 'James Wingfield',
    university: 'LSE Management',
    stats: 'A-Level: A*A*A · GCSE: 11 9s',
    image: jamesFounder,
  },
  {
    id: 'tanuj',
    name: 'Tanuj Kakumani',
    university: 'Imperial EFDS',
    stats: 'A-Level: A*A*A*A · GCSE: 7 9s',
    image: tanujKakumani,
  },
  {
    id: 'yan',
    name: 'Yan Beletskiy',
    university: 'BSc Discrete Maths at Warwick',
    stats: 'A-Level: 5 A*s · A* Maths (98%)',
    image: null,
    storageKey: 'yan',
  },
  {
    id: 'tudor',
    name: 'Tudor Cranciun',
    university: 'Imperial Offer Holder',
    stats: 'A-Level: A*A*A*A* · 200/200 Physics · Straight 9s',
    image: null,
    storageKey: 'tudor',
  },
];

export function MeetTheFounders() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [trainers, setTrainers] = useState<Trainer[]>(trainersData);
  // Start centered so Henry/James/Tanuj (indices 2,3,4) are the middle 3
  const [centerIndex, setCenterIndex] = useState(3);

  useEffect(() => {
    const loadImages = async () => {
      const entries = Object.entries(STORAGE_PATHS);
      const results = await Promise.all(
        entries.map(async ([key, path]) => {
          const { data } = await supabase.storage
            .from('trainer-uploads')
            .createSignedUrl(path, 7200);
          return [key, data?.signedUrl || null] as const;
        })
      );
      const urlMap = Object.fromEntries(results.filter(([, url]) => url));
      setTrainers((prev) =>
        prev.map((t) =>
          t.storageKey && urlMap[t.storageKey]
            ? { ...t, image: urlMap[t.storageKey] }
            : t
        )
      );
    };
    loadImages();
  }, []);

  const total = trainers.length;

  const getWrappedIndex = useCallback(
    (offset: number) => ((centerIndex + offset) % total + total) % total,
    [centerIndex, total]
  );

  // Show 3 on mobile, 5 on desktop
  const visibleOffsets = [-2, -1, 0, 1, 2];

  const getOpacity = (offset: number) => {
    if (Math.abs(offset) <= 1) return 1;
    return 0.4;
  };

  return (
    <section className="pt-8 pb-16 md:pt-12 md:pb-20 px-8 bg-muted overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal className="text-center mb-12 md:mb-16">
          <p className="text-sm sm:text-base font-medium text-muted-foreground mb-2">Meet your trainers</p>
          <h2 className="text-[1.5rem] sm:text-[2.5rem] md:text-[3.25rem] lg:text-[4rem] font-bold leading-[1.2] tracking-tight">
            <span className="text-foreground">The A* students </span>
            <span className="text-primary">behind the AI</span>
          </h2>
        </ScrollReveal>

        <div className="relative">
          {/* Carousel track */}
          <div className="flex items-center justify-center gap-6 md:gap-10 py-4">
            {visibleOffsets.map((offset) => {
              const idx = getWrappedIndex(offset);
              const trainer = trainers[idx];

              return (
                <motion.div
                  key={`${trainer.id}-${offset}`}
                  className={`flex flex-col items-center text-center flex-shrink-0 cursor-pointer ${
                    Math.abs(offset) === 2 ? 'hidden md:flex' : ''
                  }`}
                  animate={{
                    opacity: getOpacity(offset),
                  }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  onClick={() => {
                    if (offset < 0) setCenterIndex((prev) => ((prev - 1) % total + total) % total);
                    if (offset > 0) setCenterIndex((prev) => (prev + 1) % total);
                  }}
                >
                  <motion.div
                    className={`w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden shadow-lg bg-muted border-4 ${
                      isDark ? 'border-primary/20' : 'border-border'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                  >
                    {trainer.image ? (
                      <img
                        src={trainer.image}
                        alt={trainer.name}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-2xl font-bold">
                        {trainer.name.charAt(0)}
                      </div>
                    )}
                  </motion.div>
                  <h3 className="mt-4 text-sm sm:text-base md:text-lg font-bold text-foreground">
                    {trainer.name}
                  </h3>
                  <p className={`text-xs sm:text-sm font-medium ${isDark ? 'text-primary' : 'text-muted-foreground'}`}>
                    {trainer.university}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                    {trainer.stats}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Dot indicators */}
          <div className="flex justify-center gap-2 mt-6">
            {trainers.map((trainer, index) => (
              <button
                key={trainer.id}
                onClick={() => setCenterIndex(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  index === centerIndex
                    ? isDark
                      ? 'bg-primary scale-125'
                      : 'bg-foreground scale-125'
                    : 'bg-border hover:bg-muted-foreground/50'
                }`}
                aria-label={`Go to ${trainer.name}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
