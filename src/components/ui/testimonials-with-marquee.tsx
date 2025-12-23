import { cn } from "@/lib/utils"
import { TestimonialCard, TestimonialAuthor } from "@/components/ui/testimonial-card"

interface TestimonialsSectionProps {
  title: string
  description?: string
  testimonials: Array<{
    author: TestimonialAuthor
    text: string
    href?: string
  }>
  className?: string
}

export function TestimonialsSection({ 
  title,
  description,
  testimonials,
  className 
}: TestimonialsSectionProps) {
  return (
    <section id="testimonials" className={cn("py-16 md:py-20 bg-muted w-full", className)}>
      <div className="mx-auto flex flex-col items-center gap-8 text-center sm:gap-12">
        <div className="flex flex-col items-center gap-4 px-8">
          <h2 className="text-3xl font-bold text-foreground">
            {title}
          </h2>
          {description && (
            <p className="max-w-[600px] text-muted-foreground">
              {description}
            </p>
          )}
        </div>

        <div className="relative flex w-full overflow-hidden">
          <div
            className="flex [--gap:1.5rem] [gap:var(--gap)] [--duration:120s] animate-marquee"
          >
            {/* First set */}
            {[...Array(6)].map((_, setIndex) => (
              testimonials.map((testimonial, i) => (
                <TestimonialCard key={`a-${setIndex}-${i}`} {...testimonial} className="flex-shrink-0" />
              ))
            ))}
          </div>
          <div
            className="flex [--gap:1.5rem] [gap:var(--gap)] [--duration:120s] animate-marquee"
            aria-hidden="true"
          >
            {/* Duplicate set for seamless loop */}
            {[...Array(6)].map((_, setIndex) => (
              testimonials.map((testimonial, i) => (
                <TestimonialCard key={`b-${setIndex}-${i}`} {...testimonial} className="flex-shrink-0" />
              ))
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
