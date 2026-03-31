"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Atom,
  Bot,
  FlaskConical,
  FolderOpen,
  Folders,
  Globe,
  ListTodo,
  Map,
  SlidersHorizontal,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Learn", icon: Atom, step: "01" },
  { href: "/explore", label: "Explore", icon: Globe, step: "02" },
  { href: "/assess", label: "Assess", icon: SlidersHorizontal, step: "03" },
  { href: "/build", label: "Build", icon: FlaskConical, step: "04" },
  { href: "/map", label: "Map", icon: Map, step: "05" },
  { href: "/projects", label: "Projects", icon: Folders, step: "06" },
  { href: "/sessions", label: "Saved", icon: FolderOpen, step: "07" },
  { href: "/jobs", label: "Jobs", icon: ListTodo, step: "08" },
];

export function NavigationBar() {
  const pathname = usePathname();

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        borderBottom: "1px solid var(--color-border)",
        background: "rgba(5, 9, 22, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <nav
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 1.5rem",
          minHeight: "72px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #6366f1, #2dd4bf)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Atom size={18} color="#fff" strokeWidth={2} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontWeight: 800, fontSize: "1rem", letterSpacing: "-0.02em" }}>
              <span className="gradient-text">Quantum</span>
              <span style={{ color: "var(--color-text-secondary)" }}> Foundry</span>
            </span>
            <span
              style={{
                fontSize: "0.68rem",
                color: "var(--color-text-muted)",
                fontWeight: 600,
              }}
            >
              Powered by QSE
            </span>
          </div>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", flexWrap: "wrap" }}>
          {NAV_ITEMS.map(({ href, label, icon: Icon, step }) => {
            const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`nav-link${isActive ? " active" : ""}`}
                style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}
              >
                <Icon size={14} strokeWidth={2.5} />
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-text-muted)",
                    marginRight: "2px",
                  }}
                >
                  {step}
                </span>
                {label}
              </Link>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link
            href="/build#qals-lite"
            className="btn-primary"
            style={{ padding: "0.55rem 1rem", fontSize: "0.82rem" }}
          >
            <Bot size={14} />
            Ask the guide
          </Link>
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "9999px",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-text-primary)",
              fontWeight: 700,
              fontSize: "0.82rem",
            }}
          >
            N
          </div>
        </div>
      </nav>
    </header>
  );
}
