

## Fix: Social proof overlapping suggested prompts on iPad/small laptops

### Problem
On medium-sized screens (iPads ~768-1024px, small laptops ~1366px), the hero section (logo + heading + social proof badges) extends too far down and visually overlaps with the fixed-bottom suggested prompt cards. The existing tablet media query (`-mt-28`) pulls content up aggressively, but the social proof badges still collide.

### Changes (single file: `src/components/RAGChat.tsx`)

**1. Scale down social proof badges on medium screens**
- On the social proof container (line 1010), add responsive classes to reduce font size, padding, and gaps at `md` breakpoint so badges are more compact on tablets/small laptops.
- Use `md:gap-1.5 md:mt-2 lg:gap-2.5 lg:mt-3` to tighten spacing at medium breakpoints while keeping large screens untouched.

**2. Reduce hero heading size at medium breakpoint**
- The heading jumps from `sm:text-[2.25rem]` to `md:text-[2.75rem]` which is too large on iPad. Add an intermediate `md:text-[2.25rem] lg:text-[2.75rem]` split so tablets get a smaller heading.

**3. Increase bottom padding on the messages container for medium screens**
- The `pb-[160px]` on line 930 may not be enough when 4 prompt cards are showing. Add a responsive bump to `md:pb-[200px]` to ensure the scroll area clears the fixed prompts.

**4. Tighten the tablet media query margins**
- Adjust the existing tablet-specific negative margin from `-mt-28` to a less aggressive value like `-mt-16`, preventing the hero from being pushed too high and causing the social proof to sit right where the prompts are.

All changes are CSS class adjustments only — no structural or behavioral changes. Large screens remain identical.

