
## Centre Navigation Tabs on Page

### Problem
The "Home / Subjects / Launch" tabs are currently centred within the remaining flex space between the logo and right-side elements, rather than being centred relative to the full page width.

### Solution
Change the nav tabs container from `flex-1` positioning to `absolute` centring within the header. This makes the tabs visually centred on the page regardless of the logo or right-side content width.

### Change (single file)

**`src/components/Header.tsx`** (line 280):

Replace the current flex-based centring:
```tsx
<div className={`flex-1 flex justify-center min-w-0 ${hideUserDetails ? 'justify-end pr-4' : 'px-2'}`}>
```

With absolute centring:
```tsx
<div className="absolute left-1/2 -translate-x-1/2">
```

This positions the tabs at the exact horizontal centre of the header (and therefore the page), independent of the logo and right-side content.

The header already has `relative` implied by `sticky`, so no additional positioning context is needed.
