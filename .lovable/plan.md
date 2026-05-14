## Fade in the testimonials heading and match the founders heading size

Two small changes to the heading at `src/pages/HomePage.tsx:161` so it reads as the start of the testimonials section, not a leftover from the demo video.

### 1. Fade it in on scroll (instead of being statically rendered)

Wrap the `<h2>` in the existing `ScrollReveal` component (already used for the "The A* students behind the AI" heading in `MeetTheFounders.tsx:238`). This gives it the same upward fade-in that introduces the founders section, so it visually "arrives" with the testimonials rather than sitting under the tilting video.

```tsx
<ScrollReveal className="text-center mb-10">
  <h2 className="text-[1.5rem] sm:text-[2.5rem] md:text-[3.25rem] lg:text-[4rem] font-bold leading-[1.2] tracking-tight">
    10,000 students. One unfair advantage
  </h2>
</ScrollReveal>
```

Add the import: `import { ScrollReveal } from '@/components/ui/scroll-reveal';`.

### 2. Match the founders heading size exactly

Stop using `sectionHeadingClass` for this one heading and inline the exact same Tailwind size classes used by `MeetTheFounders.tsx:233/240` so the two headings are guaranteed identical at every breakpoint. (At `lg` they already compute the same; this just removes the risk of drift and makes the intent explicit.)

### Out of scope

- No changes to the testimonial columns, the tilting video, the section's negative top margin, or any other section.
- No new components, no new tokens, no animation re-tuning elsewhere.

### Files changed

- `src/pages/HomePage.tsx` (one heading block + one import)
