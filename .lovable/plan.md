

## Replace Exam Board Dropdown with Select Component

Replace the current `DropdownMenu` used for exam board selection on the `/compare` page with the existing Radix UI `Select` component for a more standard form-style selector.

### Changes

**File: `src/pages/ComparePage.tsx`**

1. **Update imports** -- Replace `DropdownMenu` imports with `Select, SelectContent, SelectItem, SelectTrigger, SelectValue` from `@/components/ui/select`

2. **Desktop exam board selector (line ~257-278)** -- Replace the `DropdownMenu` with a `Select` component:
   - Keep the same rounded-full pill styling on the trigger
   - Use `onValueChange` to call `setExamBoard`
   - Display the board label via `SelectValue`
   - Map the same board options to `SelectItem` components

3. **Mobile exam board selector (line ~304-325)** -- Same replacement for the mobile version, keeping the existing mobile styling (border, font-semibold, etc.)

4. **Keep `DropdownMenu` imports** for the subject selector (which remains a dropdown) -- only the exam board selector changes to a `Select`

### Visual Result
- The exam board picker will behave like a native-style select with a popover list, rather than a dropdown menu
- Styling remains consistent (rounded-full pill, same colors and spacing)

