"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Atom, Map, FlaskConical, Globe } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Learn", icon: Atom, step: "01" },
  { href: "/explore", label: "Explore", icon: Globe, step: "02" },
  { href: "/build", label: "Build", icon: FlaskConical, step: "03" },
  { href: "/map", label: "Map", icon: Map, step: "04" },
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
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Wordmark */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.625rem" }}>
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
          <span style={{ fontWeight: 800, fontSize: "1rem", letterSpacing: "-0.02em" }}>
            <span className="gradient-text">Quantum</span>
            <span style={{ color: "var(--color-text-secondary)" }}> Foundry</span>
          </span>
        </Link>

        {/* Nav links */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
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
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginRight: "2px" }}>
                  {step}
                </span>
                {label}
              </Link>
            );
          })}
        </div>

        {/* Status chip */}
        <div
          className="chip"
          style={{
            background: "rgba(45, 212, 191, 0.1)",
            color: "var(--color-glow-secondary)",
            border: "1px solid rgba(45,212,191,0.25)",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "var(--color-glow-secondary)",
              display: "inline-block",
            }}
          />
          Simulation Mode
        </div>
      </nav>
    </header>
  );
}
