import { motion } from 'framer-motion';
import { ScrollReveal, StaggerContainer, StaggerItem } from './scroll-reveal';

// Import testimonial screenshots
import linkedinAryaan from '@/assets/testimonials/linkedin-aryaan.png';
import instagramDm from '@/assets/testimonials/instagram-dm.png';
import zaraTweet from '@/assets/testimonials/zara-tweet.png';
import whatsappPawel from '@/assets/testimonials/whatsapp-pawel.png';
import maisamMessage from '@/assets/testimonials/maisam-message.png';
import pawelMessage from '@/assets/testimonials/pawel-message.png';
import copyPasteAwesome from '@/assets/testimonials/copy-paste-awesome.png';

const testimonialScreenshots = [
  { src: linkedinAryaan, alt: "LinkedIn testimonial from Aryaan" },
  { src: instagramDm, alt: "Instagram DM testimonial" },
  { src: zaraTweet, alt: "Testimonial from Zara" },
  { src: whatsappPawel, alt: "WhatsApp testimonial from Pawel" },
  { src: maisamMessage, alt: "Testimonial from Maisam Hussain" },
  { src: copyPasteAwesome, alt: "Testimonial about copy-paste formatting" },
  { src: pawelMessage, alt: "Testimonial message" },
];

export function ScreenshotTestimonials() {
  return (
    <section className="py-20 px-4 sm:px-8 bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Real Messages from{' '}
            <span className="bg-gradient-brand bg-clip-text text-transparent">
              Real Students
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            See what students are saying about A* AI
          </p>
        </ScrollReveal>

        <StaggerContainer 
          className="columns-1 sm:columns-2 lg:columns-3 gap-4 sm:gap-6"
          staggerDelay={0.1}
        >
          {testimonialScreenshots.map((testimonial, index) => (
            <StaggerItem key={index} className="mb-4 sm:mb-6 break-inside-avoid">
              <motion.div
                className="relative group"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative bg-card rounded-2xl overflow-hidden border border-border/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <img
                    src={testimonial.src}
                    alt={testimonial.alt}
                    className="w-full h-auto"
                    loading="lazy"
                  />
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
