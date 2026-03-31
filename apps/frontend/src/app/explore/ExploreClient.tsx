"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, ArrowRight, Info, SlidersHorizontal, X } from "lucide-react";
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
  onDetails,
}: {
  uc: UseCase;
  onAssess: (uc: UseCase) => void;
  onDetails: (uc: UseCase) => void;
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
        <div style={{ display: "grid", gap: "0.5rem", marginTop: "1.25rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            <button
              className="btn-ghost"
              style={{ justifyContent: "center", fontSize: "0.8rem", padding: "0.5rem" }}
              onClick={() => onDetails(uc)}
              id={`details-${uc.id}`}
            >
              <Info size={13} /> View Details
            </button>
            <button
              className="btn-primary"
              style={{ justifyContent: "center", fontSize: "0.8rem", padding: "0.5rem" }}
              onClick={() => onAssess(uc)}
              id={`assess-${uc.id}`}
            >
              <SlidersHorizontal size={13} /> Assess Fit
            </button>
          </div>
          <Link
            href={`/build?starter=${starter}&use_case_id=${uc.id}`}
            className="btn-ghost"
            style={{ justifyContent: "center", padding: "0.6rem 0.875rem", fontSize: "0.8rem" }}
          >
            Open Hybrid Lab <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function UseCaseDetailModal({
  useCase,
  onClose,
}: {
  useCase: UseCase;
  onClose: () => void;
}) {
  const starter = getStarterByIndustry(useCase.industry);
  const maturityLabel =
    useCase.horizon === "near-term"
      ? "Today demo / hybrid research now"
      : useCase.horizon === "mid-term"
        ? "Hybrid research now"
        : "Fault-tolerant later";

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          zIndex: 100,
          backdropFilter: "blur(4px)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 40 }}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(520px, 100vw)",
          background: "var(--color-space)",
          borderLeft: "1px solid var(--color-border)",
          zIndex: 101,
          overflowY: "auto",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
          <div>
            <div
              className="chip"
              style={{
                background: "rgba(99,102,241,0.1)",
                color: "var(--color-glow-primary)",
                border: "1px solid rgba(99,102,241,0.2)",
                marginBottom: "0.75rem",
              }}
            >
              <Info size={11} /> Use case detail
            </div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 800, lineHeight: 1.25 }}>{useCase.title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close use case details"
            style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", padding: "0.25rem" }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }}>
          <span className="chip" style={{ background: "rgba(99,102,241,0.1)", color: "var(--color-glow-primary)", border: "1px solid rgba(99,102,241,0.2)", textTransform: "capitalize" }}>
            {useCase.industry}
          </span>
          <span className="chip" style={{ background: "rgba(45,212,191,0.12)", color: "var(--color-glow-secondary)", border: "1px solid rgba(45,212,191,0.2)" }}>
            {maturityLabel}
          </span>
          <span className="chip" style={{ background: "rgba(255,255,255,0.06)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}>
            Complexity {useCase.complexity_score.toFixed(1)} / 5
          </span>
        </div>

        <div style={{ display: "grid", gap: "1rem" }}>
          {[
            ["Problem statement", useCase.description],
            [
              "Why classical gets hard",
              `As the workload scales, ${useCase.description.toLowerCase()} This pushes cost, time, or accuracy limits for purely classical baselines.`,
            ],
            ["Why quantum might help", useCase.quantum_approach],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                border: "1px solid var(--color-border)",
                borderRadius: "1rem",
                padding: "1rem",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>
                {label}
              </div>
              <div style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: "1.5rem",
            border: "1px solid rgba(99,102,241,0.16)",
            borderRadius: "1rem",
            padding: "1rem",
            background: "rgba(99,102,241,0.06)",
          }}
        >
          <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-glow-primary)", marginBottom: "0.5rem" }}>
            Recommended starter lane
          </div>
          <div style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
            Open this use case in the Hybrid Lab with the <strong style={{ color: "var(--color-text-primary)" }}>{getStarterByIndustry(useCase.industry).replaceAll("_", " ")}</strong> starter so the circuit, assessment, and architecture stay tied to the same narrative.
          </div>
        </div>

        <div style={{ display: "grid", gap: "0.75rem", marginTop: "1.5rem" }}>
          <button
            className="btn-primary"
            style={{ justifyContent: "center" }}
            onClick={onClose}
          >
            Close Details
          </button>
          <Link
            href={`/assess?starter=${starter}&use_case_id=${useCase.id}`}
            className="btn-ghost"
            style={{ justifyContent: "center" }}
          >
            Open Assess View <ArrowRight size={14} />
          </Link>
          <Link
            href={`/build?starter=${starter}&use_case_id=${useCase.id}`}
            className="btn-ghost"
            style={{ justifyContent: "center" }}
          >
            Open Hybrid Lab <ArrowRight size={14} />
          </Link>
        </div>
      </motion.div>
    </>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ExploreClient() {
  const [industry, setIndustry] = useState<IndustryTag | "all">("all");
  const [assessTarget, setAssessTarget] = useState<UseCase | null>(null);
  const [detailTarget, setDetailTarget] = useState<UseCase | null>(null);

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
              <UseCaseCard
                key={uc.id}
                uc={uc}
                onAssess={setAssessTarget}
                onDetails={setDetailTarget}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      <AnimatePresence>
        {detailTarget && (
          <UseCaseDetailModal useCase={detailTarget} onClose={() => setDetailTarget(null)} />
        )}
        {assessTarget && (
          <AssessModal useCase={assessTarget} onClose={() => setAssessTarget(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
