

## Fix: Broken Logo on Feedback Page

The feedback page references `/brand-logo.png` which is a placeholder file. The fix is to import the existing theme-aware logo assets used across the app (`src/assets/logo.png` and `src/assets/logo-dark.png`) and swap based on the current theme, matching the Header and ChatbotToolbar pattern.

### Changes

**`src/pages/FeedbackPage.tsx`**
- Import `logo` from `@/assets/logo.png` and `logoDark` from `@/assets/logo-dark.png`
- Import `useTheme` from `@/contexts/ThemeContext`
- Replace the static `<img src="/brand-logo.png">` with a theme-aware image that shows `logoDark` in dark mode and `logo` in light mode

