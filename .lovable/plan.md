## Add heading in testimonials whitespace

Add a centered h2 "10,000 students. One unfair advantage" inside the testimonials section in `src/pages/HomePage.tsx`, placed above the three scrolling columns so it occupies the whitespace below the tilting video — without moving the testimonial columns themselves.

### Change

In `src/pages/HomePage.tsx`, inside the testimonials `<section>` (around line 161), insert a heading inside the `max-w-7xl` wrapper, above the `motion.div` that holds the columns:

```tsx
<h2 className={`${sectionHeadingClass} text-center mb-10`}>
  10,000 students. One unfair advantage
</h2>
```

This reuses the existing `sectionHeadingClass` (line 88) so the typography matches every other section heading on `/`. The heading sits in the existing top padding/whitespace area; the testimonial columns stay in place (still wrapped in the same motion.div with the scroll-driven `y`/`opacity`).

No other files change.