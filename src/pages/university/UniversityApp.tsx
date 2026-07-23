import { Navigate, NavLink, Outlet, Route, Routes } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUniSync } from "@/hooks/useUniSync";
import { Header } from "@/components/Header";
import { UniversityLandingPage } from "./UniversityLandingPage";
import { UniMatchPage } from "./UniMatchPage";
import { UniResultsPage } from "./UniResultsPage";
import { UniPreparePage } from "./UniPreparePage";
import { UniWritePage } from "./UniWritePage";
import { UniOrganisePage } from "./UniOrganisePage";

const STAGES = [
  { to: "/university/match", label: "Match" },
  { to: "/university/results", label: "Results" },
  { to: "/university/prepare", label: "Prepare" },
  { to: "/university/write", label: "Write" },
  { to: "/university/organise", label: "Organise" },
];

/**
 * The /university shell: auth gate, storage hydration gate, shared header and
 * stage stepper, then the nested stage routes. Stage views read sessionStorage
 * synchronously on mount, so nothing below renders until hydration settles.
 */
export const UniversityApp = () => {
  const { user, loading: authLoading } = useAuth();
  const { hydrated } = useUniSync(user?.id);

  // Not signed in → send to login, preserving the return path (matches the
  // ?redirect= convention LoginPage honours: navigate(`/${redirect}`)).
  if (!authLoading && !user) {
    return <Navigate to="/login?redirect=university" replace />;
  }

  if (authLoading || !hydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header showNavLinks />

      <Routes>
        <Route index element={<UniversityLandingPage />} />
        {/* The stage views render on the app's own tokens (bg-background /
            text-foreground from the wrapper above), plus the stage stepper. */}
        <Route element={<StageShell />}>
          <Route path="match" element={<UniMatchPage />} />
          <Route path="results" element={<UniResultsPage />} />
          <Route path="prepare" element={<UniPreparePage />} />
          <Route path="write" element={<UniWritePage />} />
          <Route path="organise" element={<UniOrganisePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/university" replace />} />
      </Routes>
    </div>
  );
};

/** Stage stepper (A*AI pill idiom) wrapped around every stage route. */
const StageShell = () => (
  <div>
    <div className="mx-auto max-w-[1280px] px-6 pt-6 min-[860px]:px-8">
      <nav aria-label="University stages" className="overflow-x-auto">
        <div className="inline-flex w-max items-center gap-1 rounded-full border border-border bg-muted p-1">
          {STAGES.map((stage) => (
            <NavLink
              key={stage.to}
              to={stage.to}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              {stage.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
    <Outlet />
  </div>
);
