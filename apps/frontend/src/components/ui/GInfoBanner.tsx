import type { ReactNode } from "react";

export function GInfoBanner({
  children,
  tone = "blue",
  className = "",
}: {
  children: ReactNode;
  tone?: "blue" | "green" | "yellow";
  className?: string;
}) {
  const tones = {
    blue: "border-[#c6dafc] bg-[#e8f0fe] text-[#174ea6]",
    green: "border-[#c4e8cf] bg-[#e6f4ea] text-[#137333]",
    yellow: "border-[#fce8b2] bg-[#fef7e0] text-[#b06000]",
  } as const;

  return (
    <div className={`rounded-[22px] border px-4 py-3 text-sm leading-7 ${tones[tone]} ${className}`}>
      {children}
    </div>
  );
}
