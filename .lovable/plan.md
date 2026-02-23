

## Add OCR Maths to the Build Portal Subject Dropdown

A single-line change to include "OCR Maths" in the `SUBJECT_OPTIONS` array in `src/pages/BuildPage.tsx`.

### Change

**File: `src/pages/BuildPage.tsx` (line 26)**

Add a new entry to the `SUBJECT_OPTIONS` array:

```ts
const SUBJECT_OPTIONS = [
  { value: "AQA-Biology", label: "AQA Biology", subject: "Biology", board: "AQA" },
  { value: "OCR-Maths", label: "OCR Maths", subject: "Maths", board: "OCR" },
];
```

This will make "OCR Maths" available in the dropdown selector on the Build Portal. When selected, it will create/load a trainer project for OCR Maths, allowing trainers to upload specs and past papers for that subject.

