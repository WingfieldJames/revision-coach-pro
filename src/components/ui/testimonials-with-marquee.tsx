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

        <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
          <div
            className="flex overflow-hidden p-4 [--gap:1.5rem] [gap:var(--gap)] flex-row [--duration:80s]"
          >
            <div
              className="flex shrink-0 justify-around [gap:var(--gap)] animate-marquee flex-row"
            >
              {[...Array(4)].map((_, setIndex) => (
                testimonials.map((testimonial, i) => (
                  <TestimonialCard key={`${setIndex}-${i}`} {...testimonial} />
                ))
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
