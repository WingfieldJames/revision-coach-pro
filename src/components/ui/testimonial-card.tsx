import { cn } from "@/lib/utils"
import { Avatar, AvatarImage } from "@/components/ui/avatar"

export interface TestimonialAuthor {
  name: string
  handle: string
  avatar: string
}

export interface TestimonialCardProps {
  author: TestimonialAuthor
  text: string
  href?: string
  className?: string
}

export function TestimonialCard({ 
  author,
  text,
  href,
  className
}: TestimonialCardProps) {
  const Card = href ? 'a' : 'div'
  
  return (
    <Card
      {...(href ? { href, target: "_blank", rel: "noopener noreferrer" } : {})}
      className={cn(
        "flex flex-col rounded-2xl",
        "bg-card shadow-card",
        "p-6 text-start",
        "transition-all duration-200 hover:shadow-elevated",
        "w-[320px]",
        href && "cursor-pointer",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <Avatar className="h-12 w-12 flex-shrink-0">
          <AvatarImage src={author.avatar} alt={author.name} className="object-cover" />
        </Avatar>
        <div className="flex flex-col items-start">
          <strong className="text-base font-semibold text-card-foreground">
            {author.name}
          </strong>
          <p className="text-sm text-muted-foreground">
            {author.handle}
          </p>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
        {text}
      </p>
    </Card>
  )
}
