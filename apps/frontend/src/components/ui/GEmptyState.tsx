import type { ReactNode } from "react";

export function GEmptyState({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-dashed border-[var(--outline)] bg-[var(--surface-container)] p-6 text-center">
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      <div className="mt-2 text-sm leading-7 text-slate-600">{children}</div>
    </div>
  );
}
