import { Award, GraduationCap, BookOpen, Trophy } from 'lucide-react';
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/ui/scroll-reveal';
import { useTheme } from '@/contexts/ThemeContext';
import jamesFounder from '@/assets/james-founder.png';
import namanFounder from '@/assets/naman-founder.png';
import tudorFounder from '@/assets/tudor-founder.jpg';

interface Founder {
  id: string;
  name: string;
  status: string;
  image: string;
  achievements: Array<{ icon: typeof Award; text: string }>;
}

const founders: Founder[] = [
  {
    id: 'naman',
    name: 'Naman',
    status: 'Gap Year Student',
    image: namanFounder,
    achievements: [
      { icon: Award, text: "A*A*A*A*" },
      { icon: GraduationCap, text: "Straight 9s" },
      { icon: BookOpen, text: "8.9 TMUA" },
    ]
  },
  {
    id: 'tudor',
    name: 'Tudor',
    status: 'Gap Year Student',
    image: tudorFounder,
    achievements: [
      { icon: Award, text: "A*A*A*A*" },
      { icon: Trophy, text: "200/200 Physics" },
      { icon: GraduationCap, text: "Straight 9s" },
    ]
  },
  {
    id: 'james',
    name: 'James',
    status: 'LSE Student',
    image: jamesFounder,
    achievements: [
      { icon: Award, text: "A* Economics" },
      { icon: GraduationCap, text: "Straight 9s" },
      { icon: BookOpen, text: "A*A*A" },
    ]
  },
];

export function MobileFoundersSection() {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <section className="py-12 px-4 bg-muted md:hidden">
      <div className="max-w-md mx-auto">
        {/* Header: no animation in light mode */}
        {isLight ? (
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold mb-2">
              Trained by real A* students
            </h2>
            <p className="text-muted-foreground text-xs">
              Built on proven techniques from top A-Level students
            </p>
          </div>
        ) : (
          <ScrollReveal className="text-center mb-8">
            <h2 className="text-xl font-bold mb-2">
              Trained by real A* students
            </h2>
            <p className="text-muted-foreground text-xs">
              Built on proven techniques from top A-Level students
            </p>
          </ScrollReveal>
        )}

        <StaggerContainer className="space-y-4" staggerDelay={0.1}>
          {founders.map((founder) => (
            <StaggerItem key={founder.id}>
              <div className={`rounded-2xl p-4 ${isLight ? 'bg-card border border-border/30 shadow-sm' : 'bg-card border border-border/50 shadow-card'}`}>
                <div className="flex items-center gap-4">
                  {/* Photo */}
                  <div className="flex-shrink-0">
                    <div className={`w-16 h-16 rounded-xl overflow-hidden bg-muted ${isLight ? 'border-2 border-border/40' : 'border-2 border-primary/20'}`}>
                      <img 
                        src={founder.image} 
                        alt={`${founder.name} - A* Student`}
                        className="w-full h-full object-cover object-[center_25%] scale-110"
                      />
                    </div>
                  </div>

                  {/* Name, status & badges */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-foreground">{founder.name}</h3>
                      <span className={`text-xs font-medium ${isLight ? 'text-muted-foreground' : 'text-primary'}`}>{founder.status}</span>
                    </div>

                    {/* Achievement badges */}
                    <div className="flex flex-wrap gap-1.5">
                      {founder.achievements.map((achievement, i) => (
                        <div
                          key={i}
                          className={`flex items-center gap-1 rounded-full px-2 py-0.5 ${isLight ? 'bg-muted border border-border/40' : 'bg-primary/10 border border-primary/20'}`}
                        >
                          <achievement.icon className={`w-3 h-3 ${isLight ? 'text-foreground' : 'text-primary'}`} />
                          <span className="text-xs font-medium text-foreground">{achievement.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
