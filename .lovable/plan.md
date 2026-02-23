

## Extend Paper Years to Start from 2018

A single-line change to the `PAPER_YEARS` array in `src/pages/BuildPage.tsx`.

### Change

**File: `src/pages/BuildPage.tsx` (line 30)**

Update the `PAPER_YEARS` array to include 2019 and 2018:

```ts
const PAPER_YEARS = ["2024", "2023", "2022", "2021", "2020", "2019", "2018"];
```

This will add "Paper 2019" and "Paper 2018" entries to both the Past Papers upload section and the Progress checklist.

