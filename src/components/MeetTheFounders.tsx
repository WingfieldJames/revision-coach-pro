import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { useTheme } from '@/contexts/ThemeContext';

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
    id: 'zainab',
    name: 'Zainab Haider',
    university: 'UCL Politics & History',
    stats: 'A-Level: A*A*A*A*',
    image: null,
  },
  {
    id: 'aadi',
    name: 'Aadi Rakhit',
    university: 'LSE Economics ',
    stats: 'A-Level: A*A*A*A* · GCSE: 12 9s',
    image: null,
  },
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
    university: 'UCL Medicine ',
    stats: 'A-Level: A*A*AA · GCSE: 11 9s',
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
    university: 'Warwick Discrete Maths ',
    stats: 'A-Level: A*A*A*A*A* · GCSE: 10 9s',
    image: null,
    storageKey: 'yan',
  },
  {
    id: 'tudor',
    name: 'Tudor Cranciun',
    university: 'Imperial Offer Holder',
    stats: 'A-Level: A*A*A*A* · GCSES: Straight 9s',
    image: null,
    storageKey: 'tudor',
  },
  {
    id: 'fidel',
    name: 'Fidel',
    university: 'Goldman Sachs DA',
    stats: 'A-Level: A*A*A* · GCSE: Straight 9s',
    image: null,
  },
];

export function MeetTheFounders() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [trainers, setTrainers] = useState<Trainer[]>(trainersData);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(trainersData.findIndex((t) => t.id === 'james'));
  const isResetting = useRef(false);

  useEffect(() => {
    const SUPABASE_URL = 'https://xoipyycgycmpflfnrlty.supabase.co';
    const urlMap: Record<string, string> = {};
    for (const [key, path] of Object.entries(STORAGE_PATHS)) {
      urlMap[key] = `${SUPABASE_URL}/storage/v1/object/public/trainer-uploads/${encodeURI(path)}`;
    }
    setTrainers((prev) =>
      prev.map((t) =>
        t.storageKey && urlMap[t.storageKey]
          ? { ...t, image: urlMap[t.storageKey] }
          : t
      )
    );
  }, []);

  const total = trainers.length;
  // We render 3 copies: [set0][set1-middle][set2]
  const tripled = [...trainers, ...trainers, ...trainers];

  // Scroll to the middle set's James (index total + 3) on mount
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const timer = setTimeout(() => {
      const cards = el.children;
      const jamesIndex = trainers.findIndex((t) => t.id === 'james');
      const midJames = total + (jamesIndex >= 0 ? jamesIndex : 3);
      if (cards[midJames]) {
        const target = cards[midJames] as HTMLElement;
        const scrollLeft = target.offsetLeft - el.offsetWidth / 2 + target.offsetWidth / 2;
        el.scrollTo({ left: scrollLeft, behavior: 'instant' });
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [total]);

  // Infinite loop: when scrolling into first or last set, snap to middle set
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      if (isResetting.current) return;

      const cards = Array.from(el.children) as HTMLElement[];
      if (cards.length === 0) return;

      const center = el.scrollLeft + el.offsetWidth / 2;

      // Find closest card to center
      let closest = 0;
      let minDist = Infinity;
      cards.forEach((card, i) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const dist = Math.abs(center - cardCenter);
        if (dist < minDist) {
          minDist = dist;
          closest = i;
        }
      });

      // Map to real index
      setActiveIndex(closest % total);

      // If we've scrolled into the first or last copy, snap to middle
      const firstSetEnd = cards[total - 1];
      const lastSetStart = cards[total * 2];

      const firstSetEndRight = firstSetEnd.offsetLeft + firstSetEnd.offsetWidth;
      const lastSetStartLeft = lastSetStart.offsetLeft;

      if (center < firstSetEndRight || center > lastSetStartLeft + lastSetStart.offsetWidth) {
        isResetting.current = true;
        // Find equivalent card in middle set
        const realIndex = closest % total;
        const midTarget = cards[total + realIndex] as HTMLElement;
        const newScroll = midTarget.offsetLeft - el.offsetWidth / 2 + midTarget.offsetWidth / 2;
        el.scrollTo({ left: newScroll, behavior: 'instant' });
        requestAnimationFrame(() => {
          isResetting.current = false;
        });
      }
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [total]);

  const scrollToIndex = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const cards = el.children;
    const midIndex = total + index;
    if (cards[midIndex]) {
      const target = cards[midIndex] as HTMLElement;
      const scrollLeft = target.offsetLeft - el.offsetWidth / 2 + target.offsetWidth / 2;
      el.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  };

  return (
    <section className="pt-8 pb-16 md:pt-12 md:pb-20 bg-muted overflow-hidden">
      <div className="max-w-6xl mx-auto px-8">
        <div className="text-center mb-12 md:mb-16 md:hidden">
          <p className="text-sm sm:text-base font-medium text-muted-foreground mb-2">Meet your trainers</p>
          <h2 className="text-[1.5rem] sm:text-[2.5rem] font-bold leading-[1.2] tracking-tight">
            <span className="text-foreground">The A* students </span>
            <span className="text-primary">behind the AI</span>
          </h2>
        </div>
        <ScrollReveal className="text-center mb-12 md:mb-16 hidden md:block">
          <p className="text-sm sm:text-base font-medium text-muted-foreground mb-2">Meet your trainers</p>
          <h2 className="text-[2.5rem] md:text-[3.25rem] lg:text-[4rem] font-bold leading-[1.2] tracking-tight">
            <span className="text-foreground">The A* students </span>
            <span className="text-primary">behind the AI</span>
          </h2>
        </ScrollReveal>
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-10 md:gap-16 py-4 px-[calc(50vw-5rem)] overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {tripled.map((trainer, i) => (
            <div
              key={`${trainer.id}-${i}`}
              className="flex flex-col items-center text-center flex-shrink-0 w-36 sm:w-40 md:w-48"
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
            </div>
          ))}
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-2 mt-6">
          {trainers.map((trainer, index) => (
            <button
              key={trainer.id}
              onClick={() => scrollToIndex(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                index === activeIndex
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
    </section>
  );
}
