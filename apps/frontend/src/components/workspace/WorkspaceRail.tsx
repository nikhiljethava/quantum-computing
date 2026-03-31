"use client";

import Link from "next/link";

type WorkspaceSection =
  | "primer"
  | "use-cases"
  | "industry-atlas"
  | "idea-evaluator"
  | "hybrid-lab"
  | "exports"
  | "saved-sessions";

const ITEMS: Array<{ key: WorkspaceSection; label: string; href: string }> = [
  { key: "primer", label: "Primer", href: "/" },
  { key: "use-cases", label: "Use cases", href: "/explore" },
  { key: "industry-atlas", label: "Industry atlas", href: "/explore#atlas" },
  { key: "idea-evaluator", label: "Idea evaluator", href: "/assess" },
  { key: "hybrid-lab", label: "Hybrid lab", href: "/build" },
  { key: "exports", label: "Map & exports", href: "/map" },
  { key: "saved-sessions", label: "Saved sessions", href: "/sessions" },
];

export function WorkspaceRail({
  active,
  tip,
}: {
  active: WorkspaceSection;
  tip?: string;
}) {
  return (
    <aside className="flex h-full flex-col rounded-[28px] bg-[#0f172a] p-4 text-slate-100 shadow-[0_18px_40px_rgba(15,23,42,0.22)]">
      <div className="mb-5">
        <div className="text-lg font-semibold tracking-[-0.02em]">Workspace</div>
        <p className="mt-1 text-sm text-slate-400">
          One guided launchpad for learning, qualification, and prototype design.
        </p>
      </div>

      <nav className="space-y-2">
        {ITEMS.map((item) => {
          const isActive = item.key === active;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-[#2f5be3] text-white shadow-[0_14px_30px_rgba(47,91,227,0.35)]"
                  : "text-slate-300 hover:bg-white/6 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-[22px] bg-white/6 p-4 text-sm text-slate-300">
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
          Guide tips
        </div>
        <p className="leading-6">
          {tip ??
            "Start with the 60-second primer, then move into one use case before opening the hybrid lab."}
        </p>
      </div>
    </aside>
  );
}
