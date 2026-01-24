import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Award, GraduationCap, BookOpen, Trophy } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import jamesFounder from '@/assets/james-founder.png';
import namanFounder from '@/assets/naman-founder.png';

interface Founder {
  id: string;
  name: string;
  status: string;
  image: string;
  quote: string;
  achievements: Array<{ icon: typeof Award; text: string }>;
}

const founders: Founder[] = [
  {
    id: 'naman',
    name: 'Naman',
    status: 'Gap Year Student',
    image: namanFounder,
    quote: "Hi, I'm Naman. 4 A*s (Maths, Further Maths, Computer Science and Physics), TMUA score of 8.9, and straight 9s at GCSE. I built this model on everything that got me top marks in OCR CS - the pseudocode patterns, the algorithm tricks, the exam shortcuts that actually work.",
    achievements: [
      { icon: Award, text: "A*A*A*A* at A-Level" },
      { icon: GraduationCap, text: "Straight 9s at GCSE" },
      { icon: BookOpen, text: "8.9 TMUA score" },
    ]
  },
  {
    id: 'tudor',
    name: 'Tudor',
    status: 'Gap Year Student',
    image: namanFounder, // Placeholder - using Naman's image as mentioned in memory
    quote: "Hi, I'm Tudor. 4 A* grades at A-Level and 9 Grade 9s at GCSE, including perfect scores of 200/200 in Physics, 197/200 in Chemistry, and 236/240 in Mathematics. Through A* AI, you'll gain access to the exact revision strategies that drove some of the strongest Physics results in the country.",
    achievements: [
      { icon: Award, text: "A*A*A*A* at A-Level" },
      { icon: Trophy, text: "200/200 in A-Level Physics" },
      { icon: GraduationCap, text: "Straight 9s at GCSE" },
    ]
  },
  {
    id: 'james',
    name: 'James',
    status: 'LSE Student',
    image: jamesFounder,
    quote: "Hi, I'm James. A* in Economics (90% across all papers), straight 9s at GCSE, A*A*A at A-Level, now at LSE. I built this model on everything that got me top marks - the KAA structures, evaluation phrases, and diagram techniques that examiners actually reward.",
    achievements: [
      { icon: Award, text: "A* in Economics (90% across all papers)" },
      { icon: GraduationCap, text: "Straight 9s at GCSE" },
      { icon: BookOpen, text: "A*A*A at A-Level" },
    ]
  },
];

export function FoundersCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? founders.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === founders.length - 1 ? 0 : prev + 1));
  };

  const currentFounder = founders[currentIndex];

  return (
    <section className="py-16 px-8 bg-muted">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Trained by real A* students
          </h2>
          <p className="text-muted-foreground text-sm md:text-base text-center mx-auto">
            We searched the country for the sharpest A-Level students - 4 A*s, Oxbridge offers, top exam scores - and trained our AI on their proven techniques.
          </p>
        </ScrollReveal>

        <div className="relative">
          {/* Navigation Arrows */}
          <button
            onClick={goToPrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 bg-card border border-border rounded-full flex items-center justify-center shadow-card hover:shadow-elevated transition-shadow"
            aria-label="Previous founder"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 bg-card border border-border rounded-full flex items-center justify-center shadow-card hover:shadow-elevated transition-shadow"
            aria-label="Next founder"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>

          {/* Founder Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentFounder.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl rounded-3xl border border-border/50 p-8 md:p-12 overflow-hidden shadow-elevated"
            >
              <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
                {/* Photo */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="w-40 h-40 md:w-48 md:h-48 rounded-2xl overflow-hidden border-4 border-primary/20 shadow-lg bg-muted">
                      <img 
                        src={currentFounder.image} 
                        alt={`${currentFounder.name} - Founder`}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                  </div>
                  
                  {/* Name and status */}
                  <div className="text-center mt-4">
                    <h3 className="text-xl font-bold text-foreground">{currentFounder.name}</h3>
                    <p className="text-sm text-primary font-medium">{currentFounder.status}</p>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 text-center md:text-left">
                  <blockquote className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8">
                    "{currentFounder.quote}"
                  </blockquote>

                  {/* Achievement badges */}
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    {currentFounder.achievements.map((achievement, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2"
                      >
                        <achievement.icon className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">{achievement.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dots indicator */}
          <div className="flex justify-center gap-2 mt-6">
            {founders.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-primary' : 'bg-border'
                }`}
                aria-label={`Go to founder ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
