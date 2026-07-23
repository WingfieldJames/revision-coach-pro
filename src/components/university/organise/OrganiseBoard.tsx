import { useState, type Dispatch, type SetStateAction } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { needsReflection, type ActivityCard } from "@/lib/uni/prepare";

export type ColumnKey = "q1" | "q2" | "q3";
export type Columns = Record<ColumnKey, string[]>;

const COLUMN_META: { key: ColumnKey; label: string; question: string }[] = [
  { key: "q1", label: "Q1", question: "Why do you want to study this course or subject?" },
  { key: "q2", label: "Q2", question: "How have your qualifications and studies helped you prepare?" },
  { key: "q3", label: "Q3", question: "What else have you done to prepare, outside education?" },
];
const DELAY = ["reveal-delay-1", "reveal-delay-2", "reveal-delay-3"];

interface BoardProps {
  columns: Columns;
  setColumns: Dispatch<SetStateAction<Columns>>;
  cardById: Map<string, ActivityCard>;
  reasonByCardId: Map<string, string>;
  originalColumnByCardId: Map<string, ColumnKey>;
  flaggedCardIds: Set<string>;
  budget: { q1: number; q2: number; q3: number };
}

/** Round a character budget to a friendly "~1800" for quiet column meta. */
function roundBudget(n: number): number {
  return Math.round(n / 100) * 100;
}

export function OrganiseBoard({
  columns,
  setColumns,
  cardById,
  reasonByCardId,
  originalColumnByCardId,
  flaggedCardIds,
  budget,
}: BoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    // Touch devices: a short hold distinguishes a drag from a scroll.
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const columnOf = (id: string): ColumnKey | null => {
    if (id === "q1" || id === "q2" || id === "q3") return id;
    return (Object.keys(columns) as ColumnKey[]).find((k) =>
      columns[k].includes(id),
    ) ?? null;
  };

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  // Live-move a card into another column as it's dragged over it.
  function onDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const from = columnOf(String(active.id));
    const to = columnOf(String(over.id));
    if (!from || !to || from === to) return;
    setColumns((prev) => {
      const fromItems = prev[from].filter((id) => id !== active.id);
      const toItems = [...prev[to]];
      const overIsCard = over.id !== to;
      const idx = overIsCard ? toItems.indexOf(String(over.id)) : toItems.length;
      toItems.splice(idx < 0 ? toItems.length : idx, 0, String(active.id));
      return { ...prev, [from]: fromItems, [to]: toItems };
    });
  }

  // Reorder within the destination column when the drag settles.
  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;
    const col = columnOf(String(over.id));
    const from = columnOf(String(active.id));
    if (!col || !from || col !== from) return;
    const items = columns[col];
    const oldIndex = items.indexOf(String(active.id));
    const newIndex =
      over.id === col ? items.length - 1 : items.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
    setColumns((prev) => ({
      ...prev,
      [col]: arrayMove(prev[col], oldIndex, newIndex),
    }));
  }

  const activeCard = activeId ? cardById.get(activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="grid grid-cols-1 gap-6 min-[860px]:grid-cols-3 min-[860px]:gap-5">
        {COLUMN_META.map((meta, i) => (
          <Column
            key={meta.key}
            meta={meta}
            ids={columns[meta.key]}
            budget={roundBudget(budget[meta.key])}
            revealDelay={DELAY[i]}
            cardById={cardById}
            reasonByCardId={reasonByCardId}
            showReason={(id) => originalColumnByCardId.get(id) === meta.key}
            flaggedCardIds={flaggedCardIds}
          />
        ))}
      </div>

      <DragOverlay>
        {activeCard ? (
          <CardBody
            card={activeCard}
            reason={undefined}
            flagged={flaggedCardIds.has(activeCard.id)}
            dragging
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

interface ColumnProps {
  meta: { key: ColumnKey; label: string; question: string };
  ids: string[];
  budget: number;
  revealDelay: string;
  cardById: Map<string, ActivityCard>;
  reasonByCardId: Map<string, string>;
  showReason: (id: string) => boolean;
  flaggedCardIds: Set<string>;
}

function Column({
  meta,
  ids,
  budget,
  revealDelay,
  cardById,
  reasonByCardId,
  showReason,
  flaggedCardIds,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: meta.key });
  return (
    <section className={`reveal-up ${revealDelay} flex flex-col`}>
      <div className="flex items-center">
        <span aria-hidden="true" className="block h-px w-10 bg-primary" />
        <span className="ml-[14px] text-[15px] font-medium text-primary">
          {meta.label}
        </span>
      </div>
      <h2 className="mt-3 text-[20px] font-medium leading-[1.25] tracking-[-0.01em] text-foreground">
        {meta.question}
      </h2>
      <p className="mt-1 text-[13px] text-muted-foreground">~{budget} characters</p>

      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul
          ref={setNodeRef}
          className={`mt-4 flex min-h-[120px] flex-col gap-3 rounded-lg p-2 transition-colors duration-150 ${
            isOver ? "bg-muted" : "bg-muted/50"
          }`}
        >
          {ids.map((id) => {
            const card = cardById.get(id);
            if (!card) return null;
            return (
              <SortableCard
                key={id}
                card={card}
                reason={showReason(id) ? reasonByCardId.get(id) : undefined}
                flagged={flaggedCardIds.has(id)}
              />
            );
          })}
          {ids.length === 0 ? (
            <li className="px-2 py-6 text-[14px] text-muted-foreground">
              Nothing here — drag an item in.
            </li>
          ) : null}
        </ul>
      </SortableContext>
    </section>
  );
}

function SortableCard({
  card,
  reason,
  flagged,
}: {
  card: ActivityCard;
  reason: string | undefined;
  flagged: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={isDragging ? "opacity-40" : ""}
    >
      <CardBody card={card} reason={reason} flagged={flagged} />
    </li>
  );
}

/** The visible card. Shared by the column and the drag overlay. */
function CardBody({
  card,
  reason,
  flagged,
  dragging = false,
}: {
  card: ActivityCard;
  reason: string | undefined;
  flagged: boolean;
  dragging?: boolean;
}) {
  const flag = needsReflection(card);
  return (
    <div
      className={`relative cursor-grab rounded-lg border bg-card p-4 text-card-foreground transition-colors duration-150 ${
        dragging
          ? "border-primary shadow-elevated"
          : "border-border shadow-card hover:border-primary"
      } ${flag ? "border-l-[3px] border-l-destructive pl-[15px]" : ""}`}
    >
      {flagged ? (
        <span
          aria-label="referenced by a gap"
          className="absolute right-3 top-3 block h-1.5 w-1.5 rounded-full bg-primary"
        />
      ) : null}
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[17px] leading-snug text-foreground">{card.did}</p>
          {reason ? (
            <p className="mt-1 text-[15px] leading-snug text-muted-foreground">{reason}</p>
          ) : null}
          {flag ? (
            <p className="mt-2 text-[14px] font-medium text-destructive">
              needs a reflection
            </p>
          ) : null}
        </div>
        <Grip />
      </div>
    </div>
  );
}

/** A quiet six-dot drag affordance. */
function Grip() {
  return (
    <svg
      width="10"
      height="16"
      viewBox="0 0 10 16"
      fill="none"
      aria-hidden="true"
      className="mt-0.5 shrink-0 text-muted-foreground"
    >
      {[2, 8].flatMap((x) =>
        [3, 8, 13].map((y) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1" fill="currentColor" />
        )),
      )}
    </svg>
  );
}
