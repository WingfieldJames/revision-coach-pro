

## Replace free-text subject input with predefined dropdown

### What changes

**File: `src/pages/BuildPage.tsx`**

#### 1. Add a constant list of subjects currently on the website (~line 42)

```typescript
const AVAILABLE_SUBJECTS = [
  "Economics", "Computer Science", "Physics",
  "Chemistry", "Psychology", "Mathematics",
  "Biology"
];
```

These are the subjects currently live on the platform.

#### 2. Add "+ Add New Subject" option to the Subject cascading dropdown (~line 1197)

In the Subject `<Select>` (the second dropdown in the cascading selector), add an extra item at the bottom: `"+ Add New Subject"`. When selected, it opens a small inline input (or a mini dialog) where the trainer types a brand new subject name. This new subject gets created as a `trainer_project` and also becomes available in the create dialog going forward.

#### 3. Replace `<Input>` with `<Select>` in the Create Dialog (~lines 1303-1309)

Swap the free-text input for a `<Select>` dropdown. The options will be:
- All subjects from `AVAILABLE_SUBJECTS`
- Plus any unique subject names from existing `trainer_projects` that aren't already in the constant list

This means if someone previously added "Sociology" via the Subject dropdown, it appears here too.

#### 4. Flow summary

```text
Want to create "AQA Biology" (Biology already exists on site)?
  → Click "New Subject" button → Pick "Biology" from dropdown → Pick "AQA" → Done

Want to create a brand new subject like "Sociology"?
  → Go to Subject dropdown → Click "+ Add New Subject" → Type "Sociology"
  → This creates the project AND adds "Sociology" to future create dialog options
```

No database or migration changes needed. The `newSubjectName` state variable stays the same — it just gets set via `onValueChange` instead of `onChange`.

