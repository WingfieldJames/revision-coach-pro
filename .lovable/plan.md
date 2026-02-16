

# Revision Timetable Generator

A smart timetable planner that uses a weighted algorithm to allocate revision time across subjects based on the gap between predicted and target grades.

---

## 1. Subject Selection Panel

- **3 horizontal subject cards** displayed in a row (responsive: stacked on mobile)
- Each card contains:
  - A text input or dropdown for subject name
  - A predicted grade selector (D, C, B, A, A*)
  - A target grade selector (D, C, B, A, A*)
  - A personal importance slider (1-5 scale)
- A **"+ Add Subject"** button beneath to add a 4th subject (max 4)
- Each additional subject card has an X to remove it
- Cards use `bg-card border border-border rounded-2xl` styling consistent with the rest of the page

## 2. Weekly Timetable Grid

- **Layout**: Time labels on the left (06:00 to 22:00, 16 rows), 7 day columns (Mon-Sun)
- Each cell is a **1-hour block** that users can click to toggle as "free for revision"
- **Unselected blocks**: Use `bg-card` / `bg-accent` (the alt card colour for both modes)
- **Selected blocks**: Fill with the brand gradient (purple in light mode, orange in dark mode) using `background: var(--gradient-brand)`
- The grid scrolls horizontally on mobile if needed, with sticky time labels
- Day headers sit above each column

## 3. Generate Timetable Button

- A `variant="brand"` button below the grid: **"Generate Timetable"**
- Validates all inputs:
  - At least 1 subject with name filled in
  - Target grade must be higher than or equal to predicted grade
  - At least 1 free period selected
- Shows a toast error if validation fails

## 4. Allocation Algorithm

The weighting formula for each subject:

```text
grade_gap = target_grade_index - predicted_grade_index
  (where D=0, C=1, B=2, A=3, A*=4)

weight(subject) = (grade_gap + 1) * importance
  (grade_gap + 1 ensures even subjects at target still get some time)

fraction(subject) = weight(subject) / sum(all weights)

hours(subject) = total_free_hours * fraction(subject)
```

- Subjects with a bigger gap between predicted and target get proportionally more time
- Personal importance acts as a multiplier
- Hours are distributed across free slots in a **round-robin** pattern (alternating subjects to avoid long monotonous blocks)

## 5. Generated Timetable Display

- Reuses the **same grid** -- free period blocks now show the assigned subject name
- Each subject gets a distinct colour (selected from a preset palette of 4 colours that work in both modes)
- A small legend below the grid maps colours to subject names
- A **"Reset"** button to clear the generated timetable and go back to free period selection
- State is saved to `localStorage` so it persists across sessions

## 6. Placement on Page

The timetable section sits between the streak/chart area and the "Join the A* Team" section:

```text
Title: "Your road to an A*"
Streak counter
Weekly Study Time chart
Set Study Goals button
─────────────────────────
NEW: Revision Timetable section header
NEW: Subject selection cards (horizontal)
NEW: Weekly grid (time x days)
NEW: Generate / Reset button
─────────────────────────
"Join the A* Team" section
```

---

## Technical Details

### New Component
- **`src/components/RevisionTimetable.tsx`** -- self-contained component handling all state, grid rendering, algorithm, and localStorage persistence

### Storage Keys
- `astar_timetable_subjects` -- array of subject configs
- `astar_timetable_free_slots` -- `Record<string, boolean>` keyed by `"day-hour"`
- `astar_timetable_generated` -- the generated allocation map

### Integration
- Import and render `<RevisionTimetable />` in `ProgressPage.tsx` between the goals button and the "Join the A* Team" section
- No new dependencies required -- uses existing UI components (Button, Select, Slider, toast)

### Responsive Behaviour
- Desktop: 3-4 subject cards in a row, full grid visible
- Mobile: Subject cards stack vertically, grid uses horizontal scroll with sticky time column

