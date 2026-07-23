/**
 * A faint placeholder standing in for a CourseCard while the ranking loads. Its
 * blocks mirror the real card's vertical rhythm — reach label, course name,
 * university, reason lines, offer row — so swapping to a real card barely shifts
 * the layout. Pulses gently, but stays still under reduced-motion.
 */
export function SkeletonCard() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col gap-3 border-t border-border py-6 motion-safe:animate-pulse"
    >
      <div className="h-3 w-16 rounded bg-muted" />
      <div className="h-6 w-3/4 rounded bg-muted" />
      <div className="h-3 w-1/2 rounded bg-muted" />
      <div className="mt-2 flex flex-col gap-2">
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-5/6 rounded bg-muted" />
      </div>
      <div className="mt-2 h-3 w-2/5 rounded bg-muted" />
    </div>
  );
}
