import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Tone = "primary" | "secondary" | "ghost";

const toneClassName: Record<Tone, string> = {
  primary:
    "bg-[var(--primary)] text-white shadow-[var(--elevation-1)] hover:-translate-y-0.5 hover:shadow-[var(--elevation-2)]",
  secondary:
    "bg-[var(--surface-container)] text-[var(--primary)] border border-[var(--outline)] hover:border-[var(--primary)]",
  ghost:
    "bg-white/70 text-slate-700 border border-[var(--outline)] hover:border-[var(--primary)] hover:text-[var(--primary)]",
};

type SharedProps = {
  children: ReactNode;
  tone?: Tone;
  className?: string;
};

export function GButton({
  children,
  tone = "primary",
  className = "",
  ...props
}: SharedProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-[var(--radius-pill)] px-4 py-2.5 text-sm font-semibold transition ${toneClassName[tone]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function GButtonLink({
  children,
  tone = "primary",
  className = "",
  href,
  ...props
}: SharedProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-[var(--radius-pill)] px-4 py-2.5 text-sm font-semibold transition ${toneClassName[tone]} ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}
