import { motion } from 'framer-motion';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { useTheme } from '@/contexts/ThemeContext';
import henryLi from '@/assets/henry-li.jpg';
import jamesFounder from '@/assets/james-founder.png';
import tanujKakumani from '@/assets/tanuj-kakumani.jpg';

interface Founder {
  name: string;
  university: string;
  stats: string;
  image: string;
}

const founders: Founder[] = [
  {
    name: 'Henry Li',
    university: 'LSE PPE',
    stats: 'A-Level: A*A*A*A* · GCSE: 11 9s',
    image: henryLi,
  },
  {
    name: 'James Wingfield',
    university: 'LSE Management',
    stats: 'A-Level: A*A*A · GCSE: 11 9s',
    image: jamesFounder,
  },
  {
    name: 'Tanuj Kakumani',
    university: 'Imperial EFDS',
    stats: 'A-Level: A*A*A*A · GCSE: 7 9s',
    image: tanujKakumani,
  },
];

export function MeetTheFounders() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <section className="py-16 md:py-20 px-8 bg-muted">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal className="text-center mb-12 md:mb-16">
          <h2 className="text-[1.5rem] sm:text-[2.5rem] md:text-[3.25rem] lg:text-[4rem] font-bold mb-4 leading-[1.2] tracking-tight">
            <span className="text-foreground">Meet the </span>
            <span className="text-primary">founders</span>
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-3 gap-6 md:gap-10 max-w-3xl mx-auto">
          {founders.map((founder, i) => (
            <motion.div
              key={founder.name}
              className="flex flex-col items-center text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
            >
              <motion.div
                className={`w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden shadow-lg bg-muted border-4 ${isDark ? 'border-primary/20' : 'border-border'}`}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <img
                  src={founder.image}
                  alt={founder.name}
                  className="w-full h-full object-cover object-top"
                />
              </motion.div>
              <h3 className="mt-4 text-sm sm:text-base md:text-lg font-bold text-foreground">
                {founder.name}
              </h3>
              <p className={`text-xs sm:text-sm font-medium ${isDark ? 'text-primary' : 'text-muted-foreground'}`}>
                {founder.university}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                {founder.stats}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
