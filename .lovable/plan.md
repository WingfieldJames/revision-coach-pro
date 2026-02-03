

# Plan: Remove Diagram Generator from OCR Physics Pages

## Summary

Remove the Diagram Generator feature from the OCR Physics Free version page. The Deluxe version already does not have this feature enabled.

## Changes Required

### File: `src/pages/OCRPhysicsFreeVersionPage.tsx`

**Remove the `showDiagramTool` prop from the Header component:**

| Line | Current | After |
|------|---------|-------|
| 30 | `showDiagramTool` | (remove this line) |

The Header component currently receives:
```tsx
<Header
  showImageTool 
  showDiagramTool    // ← Remove this line
  showEssayMarker 
  showPastPaperFinder
  showExamCountdown
  examDates={OCR_PHYSICS_EXAMS}
  examSubjectName="OCR Physics"
  toolsLocked 
  hideUserDetails 
  productId={OCR_PHYSICS_PRODUCT_ID}
  essayMarkerLabel="6-Marker Analysis"
  essayMarkerFixedMark={6}
/>
```

After the change:
```tsx
<Header
  showImageTool 
  showEssayMarker 
  showPastPaperFinder
  showExamCountdown
  examDates={OCR_PHYSICS_EXAMS}
  examSubjectName="OCR Physics"
  toolsLocked 
  hideUserDetails 
  productId={OCR_PHYSICS_PRODUCT_ID}
  essayMarkerLabel="6-Marker Analysis"
  essayMarkerFixedMark={6}
/>
```

### File: `src/pages/OCRPhysicsPremiumPage.tsx`

**No changes needed** - The Deluxe page already does not include `showDiagramTool` in its Header props.

## Result

After this change, the OCR Physics pages will have these tools:
- **My AI** (personalization preferences)
- **6-Marker Analysis** (essay/extended response marker)
- **Past Papers** (coming soon placeholder)
- **Exam Countdown** (days until exams)

The Diagram Generator button will no longer appear on either page.

