import { createContext, useContext, useState, type ReactNode } from "react";
import { cn } from "./utils";

// Site-wide reading level. "simple" = SMA student, "tech" = professor.
// Every explainer on the site picks its copy with `t(simple, tech)`.
export type Depth = "simple" | "tech";

const KEY = "saysomething-depth";
const read = (): Depth => {
  try {
    return localStorage.getItem(KEY) === "tech" ? "tech" : "simple";
  } catch {
    return "simple";
  }
};

const Ctx = createContext<{ depth: Depth; setDepth: (d: Depth) => void }>({
  depth: "simple",
  setDepth: () => {},
});

export function DepthProvider({ children }: { children: ReactNode }) {
  const [depth, set] = useState<Depth>(read);
  const setDepth = (d: Depth) => {
    set(d);
    try {
      localStorage.setItem(KEY, d);
    } catch {}
  };
  return <Ctx.Provider value={{ depth, setDepth }}>{children}</Ctx.Provider>;
}

export function useDepth() {
  const { depth, setDepth } = useContext(Ctx);
  return { depth, setDepth, t: <T,>(simple: T, tech: T) => (depth === "simple" ? simple : tech) };
}

/** Segmented Simple/Technical switch. */
export function DepthToggle({ className, size = "sm" }: { className?: string; size?: "sm" | "lg" }) {
  const { depth, setDepth } = useDepth();
  const opts: [Depth, string, string][] =
    size === "lg"
      ? [["simple", "I'm new to AI", "Plain words, everyday analogies"], ["tech", "Show me the math", "Formulas, metrics, trade-offs"]]
      : [["simple", "Simple", ""], ["tech", "Tech", ""]];
  return (
    <div role="group" aria-label="Explanation depth" className={cn("flex gap-1 rounded-full border border-white/15 p-1", size === "lg" && "rounded-2xl p-1.5 gap-1.5", className)}>
      {opts.map(([d, label, hint]) => (
        <button
          key={d}
          type="button"
          aria-pressed={depth === d}
          onClick={() => setDepth(d)}
          className={cn(
            "transition-colors cursor-pointer",
            size === "sm"
              ? "rounded-full px-2.5 sm:px-3 py-1 text-[11px] font-medium uppercase tracking-wide"
              : "rounded-xl px-4 py-3 text-left",
            depth === d ? "bg-white text-black" : "text-white/65 hover:text-white hover:bg-white/5",
          )}
        >
          <span className={size === "lg" ? "block text-sm font-semibold" : ""}>
            {label}
            {size === "sm" && d === "tech" && <span className="hidden sm:inline">nical</span>}
          </span>
          {hint && <span className={cn("block text-xs", depth === d ? "text-black/65" : "text-white/55")}>{hint}</span>}
        </button>
      ))}
    </div>
  );
}
