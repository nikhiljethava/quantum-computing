import type { ReactNode } from "react";

export function GCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[28px] border border-[#d8e2f3] bg-white p-6 shadow-[0_14px_36px_rgba(60,64,67,0.14)] ${className}`}
    >
      {children}
    </section>
  );
}
