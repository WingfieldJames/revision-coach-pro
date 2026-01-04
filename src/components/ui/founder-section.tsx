import { motion } from 'framer-motion';
import { Quote, GraduationCap, Award, BookOpen, Trophy } from 'lucide-react';
import jamesFounder from '@/assets/james-founder.png';
import namanFounder from '@/assets/naman-founder.png';
import etienneFounder from '@/assets/etienne-founder.png';
import carlFounder from '@/assets/carl-founder.png';

interface FounderSectionProps {
  subject?: 'economics' | 'computer-science';
  examBoard?: 'edexcel' | 'aqa' | 'cie' | 'ocr';
}

export function FounderSection({ subject = 'economics', examBoard = 'edexcel' }: FounderSectionProps) {
  const subjectLabel = subject === 'computer-science' ? 'Computer Science' : 'Economics';
  const isCS = subject === 'computer-science';
  const isAQA = subject === 'economics' && examBoard === 'aqa';
  const isCIE = subject === 'economics' && examBoard === 'cie';
  
  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6, 
        ease: "easeOut" as const
      }
    }
  };

  const economicsAchievements = [
    { icon: Award, text: "A* in Economics (90% across all papers)" },
    { icon: GraduationCap, text: "Straight 9s at GCSE" },
    { icon: BookOpen, text: "A*A*A at A-Level" },
  ];

  const csAchievements = [
    { icon: Award, text: "A*A*A*A* at A-Level" },
    { icon: GraduationCap, text: "Straight 9s at GCSE" },
    { icon: BookOpen, text: "8.9 TMUA score" },
  ];

  const aqaAchievements = [
    { icon: Trophy, text: "UKMT Gold Award" },
    { icon: Award, text: "Founder of EasyNomics" },
    { icon: BookOpen, text: "John Locke Shortlist (Econ)" },
  ];

  const cieAchievements = [
    { icon: Award, text: "A*A*A* at A-Level" },
    { icon: GraduationCap, text: "International Student" },
    { icon: BookOpen, text: "5A*s in IGCSE in one year" },
  ];

  const achievements = isCS ? csAchievements : isAQA ? aqaAchievements : isCIE ? cieAchievements : economicsAchievements;

  const founderName = isCS ? "Naman" : isAQA ? "Etienne" : isCIE ? "Carl" : "James";
  const founderStatus = isCS ? "Gap Year Student" : isAQA ? "BSc Economics Student" : isCIE ? "LSE Student" : "LSE Student";

  return (
    <section className="py-16 px-6 bg-gradient-to-br from-muted/50 via-background to-muted/30">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
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

        {/* Card */}
        <motion.div
          className="relative bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl rounded-3xl border border-border/50 p-8 md:p-12 overflow-hidden shadow-elevated"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
        >
          {/* Background gradient effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 rounded-3xl" />
          
          {/* Quote icon */}
          <div className="absolute top-8 right-8 opacity-10">
            <Quote className="w-16 h-16 text-foreground" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
            {/* Photo */}
            <div className="flex-shrink-0">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-40 h-40 md:w-48 md:h-48 rounded-2xl overflow-hidden border-4 border-primary/20 shadow-lg bg-muted">
                  {isCS ? (
                    <img 
                      src={namanFounder} 
                      alt="Naman - Founder"
                      className="w-full h-full object-cover object-top"
                    />
                  ) : isAQA ? (
                    <img 
                      src={etienneFounder} 
                      alt="Etienne - Head of AQA"
                      className="w-full h-full object-cover object-top"
                    />
                  ) : isCIE ? (
                    <img 
                      src={carlFounder} 
                      alt="Carl - Head of CIE"
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <img 
                      src={jamesFounder} 
                      alt="James - Founder"
                      className="w-full h-full object-cover object-top"
                    />
                  )}
                </div>
                {/* Decorative ring */}
                <motion.div
                  className="absolute -inset-2 border-2 border-primary/20 rounded-2xl"
                  animate={{ 
                    scale: [1, 1.05, 1],
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              </motion.div>
              
              {/* Name and current status */}
              <div className="text-center mt-4">
                <h3 className="text-xl font-bold text-foreground">{founderName}</h3>
                <p className="text-sm text-primary font-medium">{founderStatus}</p>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 text-center md:text-left">
              {/* Quote */}
              <blockquote className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8">
                {isCS ? (
                  <>
                    "Hi, I'm Naman. 4 A*s (Maths, Further Maths, Computer Science and Physics), TMUA score of 8.9, and straight 9s at GCSE.
                    <br /><br />
                    I built this model on everything that got me top marks in OCR CS - the pseudocode patterns, the algorithm tricks, the exam shortcuts that actually work."
                  </>
                ) : isAQA ? (
                  <>
                    "Hi, I'm Etienne. I joined as CTO/Head of AQA to integrate my 'EasyNomics' engine directly into A* AI. I trained this model specifically on KAAE-aligned templates and fed it hundreds of AQA-specific model answers.
                    <br /><br />
                    It doesn't just know Economics; it understands exactly how to structure an essay to hit the top mark bands."
                  </>
                ) : isCIE ? (
                  <>
                    "Hi, I am Carl, an international school student from Beijing, China. I got 3A*s in A-Level (Economics, Chemistry and Pure Mathematics) and straight 5A*s in IGCSE in one year, now studying at LSE.
                    <br /><br />
                    I built this model based on my experience and knowledge that helps me to get A* in CIE A-Level Economics — the structure of essay and the logic chain."
                  </>
                ) : (
                  <>
                    "Hi, I'm James. A* in Economics (90% across all papers), straight 9s at GCSE, A*A*A at A-Level, now at LSE.
                    <br /><br />
                    I built this model on everything that got me top marks - the KAA structures, evaluation phrases, and diagram techniques that examiners actually reward."
                  </>
                )}</blockquote>

              {/* Achievement badges */}
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                {achievements.map((achievement, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                    whileHover={{ scale: 1.05, backgroundColor: "hsl(var(--primary) / 0.15)" }}
                  >
                    <achievement.icon className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">{achievement.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
