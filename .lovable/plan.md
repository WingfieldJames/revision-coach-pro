

## Remove Naman from the Founders Carousel

**What changes:**
- Edit `src/components/FoundersCarousel.tsx` to remove Naman's entry from the `founders` array
- This leaves Tudor and James as the two remaining founders in the slideshow
- The carousel dots will update automatically (from 3 to 2)

**Technical details:**
- Remove the Naman object from the `founders` array (lines ~30-44)
- Remove the unused `namanFounder` import

