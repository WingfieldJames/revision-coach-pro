import React from "react";
import { useNavigate } from "react-router-dom";
import logoDark from "@/assets/logo-dark.png";

const PURPLE = "hsl(263, 70%, 50%)";
const Chevron = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

/** Homepage-only header — a 1:1 reproduction of the "Homepage Refined" nav,
 *  including the sticky "3D-bar" that morphs in place on scroll. */
export const HomeHeader: React.FC = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = React.useState(false);
  const [subjectsOpen, setSubjectsOpen] = React.useState(false);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goTop = () => {
    navigate("/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const openSubjects = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setSubjectsOpen(true);
  };
  const closeSubjects = () => {
    closeTimer.current = setTimeout(() => setSubjectsOpen(false), 150);
  };
  const pickLevel = (level: "gcse" | "alevel") => {
    setSubjectsOpen(false);
    navigate(`/compare?level=${level === "gcse" ? "gcse" : "alevel"}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const ease = "cubic-bezier(0.22, 0.61, 0.36, 1)";
  const navItem: React.CSSProperties = {
    fontSize: 14,
    paddingBottom: 5,
    color: "#71717a",
    cursor: "pointer",
    transition: "color 0.15s ease",
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        padding: scrolled ? "10px 16px 0 16px" : "0px",
        transition: `padding 0.35s ${ease}`,
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: scrolled ? "6px 20px" : "20px 24px 8px 24px",
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: scrolled ? "1px solid #ece9f5" : "1px solid transparent",
          borderRadius: scrolled ? 18 : 0,
          boxShadow: scrolled ? "0 12px 32px rgba(24,18,50,0.10), 0 2px 8px rgba(24,18,50,0.06)" : "none",
          transition: `padding 0.35s ${ease}, border-radius 0.35s ${ease}, box-shadow 0.35s ${ease}, border-color 0.35s ease`,
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
          <img
            src={logoDark}
            alt="A* AI logo"
            onClick={goTop}
            style={{ height: scrolled ? 54 : 76, width: "auto", display: "block", cursor: "pointer", transition: `height 0.35s ${ease}` }}
          />
        </div>

        {/* Centred nav (desktop) */}
        <div className="hidden md:block" style={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
          <div style={{ display: "flex", gap: 24, paddingBottom: 1, borderBottom: "1px solid #e6e4ec" }}>
            <div
              onClick={goTop}
              style={{ fontSize: 14, paddingBottom: 5, marginBottom: -1.5, borderBottom: "2px solid #18181b", color: "#18181b", fontWeight: 500, cursor: "pointer" }}
            >
              Home
            </div>

            <div style={{ position: "relative" }} onMouseEnter={openSubjects} onMouseLeave={closeSubjects}>
              <div
                onClick={() => setSubjectsOpen((v) => !v)}
                style={{ ...navItem, display: "flex", alignItems: "center", gap: 4 }}
                onMouseOver={(e) => (e.currentTarget.style.color = "#18181b")}
                onMouseOut={(e) => (e.currentTarget.style.color = "#71717a")}
              >
                Subjects
                <Chevron />
              </div>
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  transform: `translateX(-50%) scale(${subjectsOpen ? 1 : 0.95})`,
                  top: "calc(100% + 8px)",
                  width: 176,
                  background: "#ffffff",
                  borderRadius: 8,
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  border: "1px solid #e6e4ec",
                  overflow: "hidden",
                  opacity: subjectsOpen ? 1 : 0,
                  pointerEvents: subjectsOpen ? "auto" : "none",
                  transformOrigin: "top",
                  transition: "opacity 0.15s ease, transform 0.15s ease",
                  zIndex: 50,
                }}
              >
                {[
                  { label: "GCSE", v: "gcse" as const },
                  { label: "A-Level", v: "alevel" as const },
                ].map((o) => (
                  <div
                    key={o.v}
                    onClick={() => pickLevel(o.v)}
                    style={{ padding: "10px 16px", fontSize: 14, cursor: "pointer", color: "#18181b" }}
                    onMouseOver={(e) => (e.currentTarget.style.background = "#faf5ff")}
                    onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {o.label}
                  </div>
                ))}
              </div>
            </div>

            <div
              onClick={() => { navigate("/university"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              style={navItem}
              onMouseOver={(e) => (e.currentTarget.style.color = "#18181b")}
              onMouseOut={(e) => (e.currentTarget.style.color = "#71717a")}
            >
              Uni Apps
            </div>
            <div
              onClick={() => { navigate("/schools"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              style={navItem}
              onMouseOver={(e) => (e.currentTarget.style.color = "#18181b")}
              onMouseOut={(e) => (e.currentTarget.style.color = "#71717a")}
            >
              Schools
            </div>
          </div>
        </div>

        {/* Start Studying */}
        <div style={{ flexShrink: 0 }}>
          <button
            onClick={() => { navigate("/select"); window.scrollTo(0, 0); }}
            style={{
              background: PURPLE,
              color: "#ffffff",
              border: "none",
              borderRadius: 9999,
              padding: "10px 24px",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              transition: "all 0.3s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 16px rgba(79,54,179,0.25)";
              e.currentTarget.style.background = "hsl(263, 70%, 45%)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
              e.currentTarget.style.background = PURPLE;
            }}
          >
            Start Studying
          </button>
        </div>
      </div>
    </header>
  );
};
