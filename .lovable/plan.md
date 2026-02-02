

# 6-Marker Analysis Feature for OCR Physics

## Summary
Transform the Essay Marker into a streamlined "6-Marker Analysis" tool specifically for OCR Physics chatbots. This tool will always mark submissions as 6-mark questions (the standard extended response format for OCR Physics), removing the need for mark selection.

## Changes Overview

### 1. Header Component - Add Customization Props
**File: `src/components/Header.tsx`**

Add two new optional props:
- `essayMarkerLabel?: string` - Custom button text (default: "Essay Marker")
- `essayMarkerFixedMark?: number` - When set, passes to EssayMarkerTool to use a fixed mark value

Pass these props to the EssayMarkerTool component when rendering.

### 2. EssayMarkerTool - Support Fixed Mark Mode
**File: `src/components/EssayMarkerTool.tsx`**

Add two new optional props:
- `fixedMark?: number` - When provided, hides the mark selector and uses this value
- `toolLabel?: string` - Custom header title (default: "Essay Marker")

When `fixedMark` is set:
- Hide the "Number of Marks" selector section entirely
- Use the fixed mark value for prompt generation
- Display the custom `toolLabel` in the header

### 3. OCR Physics Premium Page - Use New Props
**File: `src/pages/OCRPhysicsPremiumPage.tsx`**

Pass the new props to Header:
- `essayMarkerLabel="6-Marker Analysis"`
- `essayMarkerFixedMark={6}`

### 4. OCR Physics Free Page - Use New Props
**File: `src/pages/OCRPhysicsFreeVersionPage.tsx`**

Pass the same props to Header:
- `essayMarkerLabel="6-Marker Analysis"`
- `essayMarkerFixedMark={6}`

---

## Technical Details

### New Header Props Interface
```typescript
interface HeaderProps {
  // ... existing props
  essayMarkerLabel?: string;      // Custom label for the button
  essayMarkerFixedMark?: number;  // Fixed mark value - hides selector when set
}
```

### New EssayMarkerTool Props Interface
```typescript
interface EssayMarkerToolProps {
  // ... existing props
  fixedMark?: number;   // When set, uses this mark value and hides selector
  toolLabel?: string;   // Custom header title
}
```

### Prompt Generation
When `fixedMark={6}` is set, the prompt will be:
```
Mark my 6 marker. Use exact marking criteria.

[essay text]
```

---

## What Won't Change
- All other subjects (Economics, OCR CS) continue using the full Essay Marker with mark options
- Image upload/OCR functionality remains available
- Free tier usage limits still apply
- The core marking logic in the RAG system remains unchanged

