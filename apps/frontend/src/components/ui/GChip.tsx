import type { ReactNode } from "react";

export function GChip({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: "blue" | "green" | "yellow" | "red" | "neutral";
  className?: string;
}) {
  const tones = {
    blue: "bg-[#e8f0fe] text-[#1967d2] border-[#c6dafc]",
    green: "bg-[#e6f4ea] text-[#137333] border-[#c4e8cf]",
    yellow: "bg-[#fef7e0] text-[#b06000] border-[#fce8b2]",
    red: "bg-[#fce8e6] text-[#c5221f] border-[#fad2cf]",
    neutral: "bg-slate-50 text-slate-600 border-slate-200",
  } as const;

  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-[var(--radius-pill)] border px-3 py-1 text-xs font-semibold ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
