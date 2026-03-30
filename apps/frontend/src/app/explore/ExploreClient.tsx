"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, ArrowRight, Info, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useUseCases } from "@/lib/hooks";
import { IndustryTag, UseCase } from "@/types/api";
import { AssessModal } from "@/components/assessment/AssessModal";
import { getStarterByIndustry } from "@/lib/studio-mocks";

// ── Constants ──────────────────────────────────────────────────────────────

const INDUSTRIES: { value: IndustryTag | "all"; label: string; emoji: string }[] = [
  { value: "all", label: "All Industries", emoji: "🌐" },
  { value: "finance", label: "Finance", emoji: "💰" },
  { value: "pharma", label: "Pharma", emoji: "🔬" },
  { value: "logistics", label: "Logistics", emoji: "🚛" },
  { value: "energy", label: "Energy", emoji: "⚡" },
  { value: "materials", label: "Materials", emoji: "⚗️" },
  { value: "aerospace", label: "Aerospace", emoji: "🛸" },
];

const HORIZON_COLORS: Record<string, string> = {
  "near-term": "#2dd4bf",
  "mid-term": "#f59e0b",
  "long-term": "#a78bfa",
};

function ComplexityBar({ score }: { score: number }) {
  const pct = ((score - 1) / 4) * 100;
  return (
    <div style={{ marginTop: "0.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--color-text-muted)", marginBottom: "4px" }}>
        <span>Implementation Complexity</span>
        <span style={{ color: "var(--color-text-secondary)" }}>{score.toFixed(1)} / 5</span>
      </div>
      <div style={{ height: "4px", background: "var(--color-nebula)", borderRadius: "2px", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: `linear-gradient(90deg, var(--color-glow-primary), var(--color-glow-accent))`,
            borderRadius: "2px",
            transition: "width 0.6s ease",
          }}
        />
      </div>
    </div>
  );
}

function UseCaseCard({
  uc,
  onAssess,
}: {
  uc: UseCase;
  onAssess: (uc: UseCase) => void;
}) {
  const horizonColor = HORIZON_COLORS[uc.horizon] ?? "#94a3b8";
  const starter = getStarterByIndustry(uc.industry);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.25 }}
    >
      <div
        className="glass"
        style={{
          padding: "1.5rem",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          transition: "transform 0.2s, border-color 0.2s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
          (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(99,102,241,0.4)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "";
          (e.currentTarget as HTMLDivElement).style.borderColor = "";
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
          <span
            className="chip"
            style={{
              background: `${horizonColor}18`,
              color: horizonColor,
              border: `1px solid ${horizonColor}40`,
            }}
          >
            {uc.horizon}
          </span>
          <span
            className="chip"
            style={{
              background: "rgba(99,102,241,0.1)",
              color: "var(--color-glow-primary)",
              border: "1px solid rgba(99,102,241,0.2)",
              textTransform: "capitalize",
            }}
          >
            {uc.industry}
          </span>
        </div>

        <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem", lineHeight: 1.3 }}>
          {uc.title}
        </h3>
        <p style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)", lineHeight: 1.6, flexGrow: 1, marginBottom: "1rem" }}>
          {uc.description}
        </p>

        {/* Quantum approach */}
        <div
          style={{
            background: "rgba(99,102,241,0.06)",
            border: "1px solid rgba(99,102,241,0.12)",
            borderRadius: "0.5rem",
            padding: "0.75rem",
            marginBottom: "1rem",
          }}
        >
          <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--color-glow-primary)", marginBottom: "0.375rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Quantum Approach
          </div>
          <p style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)", lineHeight: 1.55, margin: 0 }}>
            {uc.quantum_approach}
          </p>
        </div>

        <ComplexityBar score={uc.complexity_score} />

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.25rem" }}>
          <button
            className="btn-primary"
            style={{ flex: 1, justifyContent: "center", fontSize: "0.8rem", padding: "0.5rem" }}
            onClick={() => onAssess(uc)}
            id={`assess-${uc.id}`}
          >
            <SlidersHorizontal size={13} /> Assess Fit
          </button>
          <Link
            href={`/build?starter=${starter}&use_case_id=${uc.id}`}
            className="btn-ghost"
            style={{ padding: "0.5rem 0.875rem", fontSize: "0.8rem" }}
          >
            Open Hybrid Lab <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ExploreClient() {
  const [industry, setIndustry] = useState<IndustryTag | "all">("all");
  const [assessTarget, setAssessTarget] = useState<UseCase | null>(null);

  const { data, isLoading, isError } = useUseCases(
    industry === "all" ? undefined : industry
  );

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "3rem 1.5rem 6rem" }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="chip" style={{ background: "rgba(45,212,191,0.1)", color: "var(--color-glow-secondary)", border: "1px solid rgba(45,212,191,0.25)", marginBottom: "1rem" }}>
          <Globe size={11} /> Industry Atlas
        </div>
        <h1 style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)", marginBottom: "0.75rem" }}>
          Explore Quantum Use Cases
        </h1>
        <p style={{ color: "var(--color-text-secondary)", maxWidth: "560px", marginBottom: "2rem", lineHeight: 1.7 }}>
          {data?.total ?? "..."} curated use cases across {INDUSTRIES.length - 1} industries.
          Click <strong style={{ color: "var(--color-text-primary)" }}>Assess Fit</strong> to run the
          QALS-lite readiness score for any use case.
        </p>

        {/* Industry filter */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "2.5rem" }}>
          {INDUSTRIES.map(({ value, label, emoji }) => (
            <button
              key={value}
              id={`filter-${value}`}
              onClick={() => setIndustry(value)}
              style={{
                padding: "0.4rem 0.875rem",
                borderRadius: "9999px",
                border: `1px solid ${industry === value ? "var(--color-glow-primary)" : "var(--color-border)"}`,
                background: industry === value ? "rgba(99,102,241,0.15)" : "transparent",
                color: industry === value ? "var(--color-glow-primary)" : "var(--color-text-secondary)",
                fontSize: "0.8rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
              }}
            >
              {emoji} {label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Grid */}
      {isLoading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: "360px" }} />
          ))}
        </div>
      )}

      {isError && (
        <div className="glass" style={{ padding: "2rem", textAlign: "center", color: "var(--color-glow-warn)" }}>
          <Info size={20} style={{ marginBottom: "0.5rem" }} />
          <p>Unable to load use cases. Is the backend running?</p>
          <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            Start with: <code>docker compose up</code> or <code>uvicorn foundry_backend.main:app</code>
          </p>
        </div>
      )}

      {data && (
        <AnimatePresence mode="popLayout">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {data.items.map((uc) => (
              <UseCaseCard key={uc.id} uc={uc} onAssess={setAssessTarget} />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Assess modal */}
      <AnimatePresence>
        {assessTarget && (
          <AssessModal useCase={assessTarget} onClose={() => setAssessTarget(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
