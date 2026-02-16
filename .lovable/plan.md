

# Update Light Mode Grey to Off-White (#f9fafb)

Replace the darker grey used across the site in light mode with the requested off-white colour, and make testimonial cards white.

---

## What Changes

### 1. Update the `--muted` CSS variable (light mode only)

In `src/index.css`, change the light-mode `:root` muted value:

- **Before**: `--muted: 240 5% 96%;` (renders as ~#F2F2F3, a noticeable grey)
- **After**: `--muted: 211 23% 98%;` (renders as #f9fafb, a soft off-white)

This single change propagates everywhere `bg-muted` is used in light mode: FAQ accordion items, testimonial section backgrounds, chat message backgrounds, code blocks, feature cards, and more. Dark mode is untouched.

### 2. Update the `--card` CSS variable (light mode only)

The card background also uses the same darker grey:

- **Before**: `--card: 240 5% 96%;`
- **After**: `--card: 0 0% 100%;` (pure white)

This makes all cards (including testimonial cards on the /compare page) render as white in light mode, sitting cleanly on top of the off-white muted backgrounds.

### 3. Update the `--secondary` CSS variable (light mode only)

Secondary also matches the old grey:

- **Before**: `--secondary: 240 5% 96%;`
- **After**: `--secondary: 211 23% 98%;`

### 4. Update the `--accent` CSS variable (light mode only)

- **Before**: `--accent: 240 5% 94%;`
- **After**: `--accent: 211 23% 96%;` (slightly darker than muted, preserving the subtle contrast for hover states and accents)

---

## Result

- **Testimonials section** ("Loved by sixth formers"): off-white background (`bg-muted` = #f9fafb) with white cards (`bg-card` = #ffffff)
- **FAQ sections**: off-white accordion items
- **Compare page plan section**: off-white background
- **Charts, code blocks, feature cards**: all shift from grey to off-white
- **Dark mode**: completely unchanged

---

## Technical Details

### File Modified
- `src/index.css` -- 4 CSS variable value changes in the `:root` block (lines 14, 25, 28, 33)

No component files need changing since they already reference these CSS variables via Tailwind classes (`bg-muted`, `bg-card`, etc.).

