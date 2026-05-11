## Goal
Give the hero device-mockup image (right side of the homepage hero) a smooth, subtle right-to-left drift as the user scrolls down. The image should never fully reveal — it stays partially clipped off the right edge, just like today.

## Where
`src/pages/HomePage.tsx`, lines 194–203 — the `Right side - Device mockup` block (desktop only, `hidden md:flex`).

## Approach

1. Convert the wrapper around the `<img>` into a `motion.div` from framer-motion (already used elsewhere in the project, e.g. `MeetTheFounders`).
2. Use framer-motion's `useScroll` + `useTransform` driven by the hero `<section>` ref so the motion is tied directly to scroll position (smoother and more predictable than scroll listeners + state).
3. Wrap the resulting `MotionValue` in `useSpring` with gentle damping so the movement eases instead of tracking 1:1 with the scrollwheel — this is the key to "as smooth as possible".
4. Map scroll progress (`0 → 1` across the hero) to a small horizontal translate, e.g. `0px → -80px` (subtle, ~6–8% of the mockup width). The starting position keeps the current `-mr-20 xl:-mr-40 2xl:-mr-64` clipping, and the negative translate only pulls it further left, so the right edge stays cropped throughout — it never fully reveals.
5. Desktop-only (already gated by `hidden md:flex`); skip the effect on mobile to avoid jank. Respect `prefers-reduced-motion` by zeroing the transform when the user opts out.

## Technical details

- Add a `heroRef` on the hero `<section>` (line 207's parent).
- `const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })`
- `const xRaw = useTransform(scrollYProgress, [0, 1], [0, -80])`
- `const x = useSpring(xRaw, { stiffness: 80, damping: 20, mass: 0.5 })` for the buttery feel.
- Apply `style={{ x }}` to the `motion.div` wrapping the `<img>`. Add `will-change: transform` for GPU compositing.
- No layout/width changes — the existing `max-w-[720px] xl:max-w-[950px] 2xl:max-w-[1200px]` and negative right margins stay, so the crop on the right edge is preserved.
- Reduced-motion: `const prefersReducedMotion = useReducedMotion()` from framer-motion → if true, set the transform output to `[0, 0]`.

## Out of scope
- No changes to mobile layout, copy, CTAs, or any other section.
- No new dependencies (framer-motion is already installed).
