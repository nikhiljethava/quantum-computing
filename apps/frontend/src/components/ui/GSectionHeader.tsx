import type { ReactNode } from "react";

export function GSectionHeader({
  eyebrow,
  title,
  children,
  level = 2,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
  level?: 1 | 2;
}) {
  const Heading = level === 1 ? "h1" : "h2";

  return (
    <div className="grid gap-2">
      {eyebrow ? (
        <div className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary)]">
          {eyebrow}
        </div>
      ) : null}
      <Heading className="text-[clamp(1.5rem,3vw,2.35rem)] font-black tracking-[-0.04em] text-slate-950">
        {title}
      </Heading>
      {children ? <div className="max-w-3xl text-sm leading-7 text-slate-600">{children}</div> : null}
    </div>
  );
}
