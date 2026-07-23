import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { pushToSupabase } from "@/lib/uni/storage";
import { resolveCourse } from "@/lib/uni/catalogue";
import { ORGANISE_STORAGE_KEY } from "@/lib/uni/constants";
import { loadInputs } from "@/lib/uni/intake";
import { loadFinalList, type FinalCourse } from "@/lib/uni/results";
import { loadPool, type ActivityCard } from "@/lib/uni/prepare";
import type {
  Arrangement,
  Gap,
  GapSeverity,
  OrganiseRequest,
} from "@/lib/uni/organise";
import type { MatchInputs } from "@/lib/uni/types";
import { OrganiseThinking } from "@/components/university/organise/OrganiseThinking";
import {
  OrganiseBoard,
  type ColumnKey,
  type Columns,
} from "@/components/university/organise/OrganiseBoard";

const SEVERITY_RANK: Record<GapSeverity, number> = { high: 0, medium: 1, low: 2 };

/** Ask the server to arrange the material. Throws on failure (caller shows retry). */
async function requestArrangement(req: OrganiseRequest): Promise<Arrangement> {
  const { data, error } = await supabase.functions.invoke("uni-organise", {
    body: req,
  });
  if (error) throw new Error(`Organise request failed: ${error.message}`);
  return data as Arrangement;
}

/** The chosen courses, for the read-only "Writing for" line. */
function useChosenCourses(finalList: FinalCourse[] | null) {
  return useMemo(() => {
    if (!finalList || finalList.length === 0) return [];
    const byId = resolveCourse(finalList);
    return finalList
      .map((f) => byId.get(f.courseId))
      .filter((c): c is NonNullable<typeof c> => c !== undefined);
  }, [finalList]);
}

function truncate(s: string, n = 48): string {
  return s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;
}

export const UniOrganisePage = () => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [pool, setPool] = useState<ActivityCard[]>([]);
  const [inputs, setInputs] = useState<MatchInputs | null>(null);
  const [finalList, setFinalList] = useState<FinalCourse[] | null>(null);

  const [arrangement, setArrangement] = useState<Arrangement | null>(null);
  const [columns, setColumns] = useState<Columns | null>(null);
  const [settled, setSettled] = useState(false);
  const [animationDone, setAnimationDone] = useState(false);
  const [error, setError] = useState(false);

  const chosen = useChosenCourses(finalList);

  const run = useCallback(
    (p: ActivityCard[], inp: MatchInputs, fl: FinalCourse[]) => {
      setError(false);
      setSettled(false);
      setAnimationDone(false);
      setArrangement(null);
      setColumns(null);
      let active = true;
      requestArrangement({ inputs: inp, finalList: fl, pool: p })
        .then((a) => {
          if (!active) return;
          setArrangement(a);
          setColumns({
            q1: a.boxes.q1.map((x) => x.cardId),
            q2: a.boxes.q2.map((x) => x.cardId),
            q3: a.boxes.q3.map((x) => x.cardId),
          });
        })
        .catch(() => {
          if (active) setError(true);
        })
        .finally(() => {
          if (active) setSettled(true);
        });
      return () => {
        active = false;
      };
    },
    [],
  );

  // Read the pool on mount and arrange it — the shell has already settled
  // storage (server work pulled in for the signed-in user).
  useEffect(() => {
    const p = loadPool();
    const inp = loadInputs();
    const fl = loadFinalList();
    setPool(p);
    setInputs(inp);
    setFinalList(fl);
    setMounted(true);
    // Guard: nothing to arrange — don't call the API.
    if (p.length === 0) return;
    if (!inp) {
      setError(true);
      setSettled(true);
      return;
    }
    return run(p, inp, fl ?? []);
  }, [run]);

  // Lookups for the board, derived from the pool and the arrangement.
  const cardById = useMemo(() => new Map(pool.map((c) => [c.id, c])), [pool]);
  const { reasonByCardId, originalColumnByCardId, flaggedCardIds } = useMemo(() => {
    const reason = new Map<string, string>();
    const original = new Map<string, ColumnKey>();
    const flagged = new Set<string>();
    if (arrangement) {
      (["q1", "q2", "q3"] as ColumnKey[]).forEach((k) => {
        arrangement.boxes[k].forEach((p) => {
          reason.set(p.cardId, p.reason);
          original.set(p.cardId, k);
        });
      });
      arrangement.gaps.forEach((g) =>
        g.relatedCardIds.forEach((id) => flagged.add(id)),
      );
    }
    return {
      reasonByCardId: reason,
      originalColumnByCardId: original,
      flaggedCardIds: flagged,
    };
  }, [arrangement]);

  function startWriting() {
    if (columns) {
      sessionStorage.setItem(ORGANISE_STORAGE_KEY, JSON.stringify(columns));
      pushToSupabase(ORGANISE_STORAGE_KEY, columns);
    }
    navigate("/university/write");
  }

  if (!mounted) return null;

  // ---- Empty-pool guard: nothing to arrange ----
  if (pool.length === 0) {
    return (
      <main className="mx-auto max-w-[1280px] px-6 py-16 min-[860px]:px-8 min-[860px]:py-20">
        <div className="reveal-up reveal-delay-1 max-w-[560px]">
          <h1 className="text-[clamp(36px,5vw,56px)] font-medium leading-[1.05] tracking-[-0.03em] text-foreground">
            Your structure.
          </h1>
          <p className="mt-4 text-[18px] leading-[1.5] text-muted-foreground">
            Add some material in Prepare first — the organiser needs something
            to work with.
          </p>
          <Button asChild variant="brand" className="mt-6 rounded-full px-7">
            <Link to="/university/prepare">Back to your material →</Link>
          </Button>
        </div>
      </main>
    );
  }

  const loading = !error && (!settled || !animationDone || !columns);

  return (
    <main className="mx-auto max-w-[1280px] px-6 py-16 min-[860px]:px-8 min-[860px]:py-20">
      <div className="flex flex-col gap-16 pb-24">
        <div className="reveal-up reveal-delay-1 max-w-[680px]">
          <h1 className="text-[clamp(36px,5vw,56px)] font-medium leading-[1.05] tracking-[-0.03em] text-foreground">
            Your structure.
          </h1>
          <p className="mt-4 text-[18px] leading-[1.5] text-muted-foreground">
            We&apos;ve arranged your material into the three questions. Move
            anything you&apos;d place differently — then start writing.
          </p>

          {chosen.length > 0 ? (
            <div className="mt-6 flex items-center">
              <span aria-hidden="true" className="block h-px w-10 bg-primary" />
              <p className="ml-[14px] text-[15px] text-muted-foreground">
                Writing for{" "}
                <span className="text-foreground">
                  {chosen.map((c) => `${c.name}, ${c.university}`).join(" · ")}
                </span>
              </p>
            </div>
          ) : null}

          {loading ? (
            <OrganiseThinking
              ready={settled}
              onDone={() => setAnimationDone(true)}
            />
          ) : null}

          {error ? (
            <div className="mt-6">
              <p className="text-[15px] text-muted-foreground">
                We couldn&apos;t arrange your material just now.
              </p>
              <Button
                type="button"
                variant="brand"
                onClick={() => inputs && run(pool, inputs, finalList ?? [])}
                className="mt-3 rounded-full px-7"
              >
                Try again
              </Button>
            </div>
          ) : null}
        </div>

        {!loading && !error && columns && arrangement ? (
          <>
            <OrganiseBoard
              columns={columns}
              setColumns={setColumns as Dispatch<SetStateAction<Columns>>}
              cardById={cardById}
              reasonByCardId={reasonByCardId}
              originalColumnByCardId={originalColumnByCardId}
              flaggedCardIds={flaggedCardIds}
              budget={arrangement.budget}
            />

            {arrangement.gaps.length > 0 ? (
              <GapsSection gaps={arrangement.gaps} cardById={cardById} />
            ) : null}

            <div className="flex justify-end border-t border-border pt-6">
              <Button
                type="button"
                variant="brand"
                onClick={startWriting}
                className="rounded-full px-7"
              >
                Start writing →
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
};

function GapsSection({
  gaps,
  cardById,
}: {
  gaps: Gap[];
  cardById: Map<string, ActivityCard>;
}) {
  const sorted = [...gaps].sort(
    (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity],
  );
  return (
    <section>
      <div className="flex items-center">
        <span aria-hidden="true" className="block h-px w-10 bg-primary" />
        <h2 className="ml-[14px] text-[15px] font-medium text-primary">
          What to strengthen
        </h2>
      </div>
      <ul className="mt-6 flex max-w-[820px] flex-col gap-6">
        {sorted.map((g, i) => {
          const high = g.severity === "high";
          const names = g.relatedCardIds
            .map((id) => cardById.get(id)?.did)
            .filter((d): d is string => Boolean(d))
            .map((d) => truncate(d));
          return (
            <li
              key={i}
              className={`border-l-2 pl-4 ${
                high ? "border-l-destructive" : "border-l-border"
              }`}
            >
              <span
                className={`text-[13px] font-medium ${
                  high ? "text-destructive" : "text-muted-foreground"
                }`}
              >
                {g.severity}
              </span>
              <p className="mt-1 text-[17px] leading-[1.5] text-foreground">
                {g.message}
              </p>
              <p className="mt-1 text-[15px] leading-[1.5] text-muted-foreground">
                {g.action}
              </p>
              {names.length > 0 ? (
                <p className="mt-1.5 text-[13px] text-muted-foreground">
                  relates to: {names.map((n) => `“${n}”`).join(", ")}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
