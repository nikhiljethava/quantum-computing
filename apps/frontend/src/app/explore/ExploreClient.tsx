"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  FileBadge2,
  Globe,
  Info,
  Layers3,
  Rocket,
  SlidersHorizontal,
  X,
} from "lucide-react";
import Link from "next/link";

import { AssessModal } from "@/components/assessment/AssessModal";
import { useUseCases } from "@/lib/hooks";
import { getStarterByIndustry } from "@/lib/studio-mocks";
import { IndustryTag, UseCase } from "@/types/api";

const INDUSTRIES: { value: IndustryTag | "all"; label: string; emoji: string }[] = [
  { value: "all", label: "All Industries", emoji: "🌐" },
  { value: "finance", label: "Finance", emoji: "💰" },
  { value: "pharma", label: "Pharma", emoji: "🔬" },
  { value: "logistics", label: "Logistics", emoji: "🚛" },
  { value: "energy", label: "Energy", emoji: "⚡" },
  { value: "materials", label: "Materials", emoji: "⚗️" },
  { value: "aerospace", label: "Aerospace", emoji: "🛸" },
];

const HORIZON_LABELS: Record<string, string> = {
  "near-term": "Hybrid research now",
  "mid-term": "Pilot with scoped chemistry or simulation",
  "long-term": "Fault-tolerant later",
};

function formatPublishedDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return value;
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function FeaturedUseCaseCard({
  useCase,
  onDetails,
  onAssess,
}: {
  useCase: UseCase;
  onDetails: (useCase: UseCase) => void;
  onAssess: (useCase: UseCase) => void;
}) {
  const starter = getStarterByIndustry(useCase.industry);
  const evidenceItems = useCase.evidence_items.slice(0, 2);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.28 }}
      className="glass"
      style={{
        padding: "1.5rem",
        borderRadius: "1.5rem",
        background:
          "linear-gradient(180deg, rgba(10,18,42,0.92) 0%, rgba(10,18,42,0.8) 100%)",
        display: "grid",
        gap: "1rem",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
        <span
          className="chip"
          style={{
            background: "rgba(99,102,241,0.14)",
            color: "var(--color-glow-primary)",
            border: "1px solid rgba(99,102,241,0.3)",
          }}
        >
          Featured scenario #{useCase.featured_rank}
        </span>
        <span className="chip" style={{ textTransform: "capitalize" }}>
          {useCase.industry}
        </span>
        <span
          className="chip"
          style={{
            background: "rgba(45,212,191,0.12)",
            color: "var(--color-glow-secondary)",
            border: "1px solid rgba(45,212,191,0.24)",
          }}
        >
          {HORIZON_LABELS[useCase.horizon] ?? useCase.horizon}
        </span>
      </div>

      <div style={{ display: "grid", gap: "0.5rem" }}>
        <h3 style={{ fontSize: "1.35rem", fontWeight: 800, margin: 0 }}>{useCase.title}</h3>
        <p
          style={{
            fontSize: "0.95rem",
            color: "var(--color-text-secondary)",
            lineHeight: 1.7,
            margin: 0,
          }}
        >
          {useCase.description}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gap: "0.875rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        }}
      >
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "1rem",
            padding: "0.9rem",
            background: "rgba(255,255,255,0.04)",
          }}
        >
          <div style={{ fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: "0.35rem" }}>
            Persona
          </div>
          <div style={{ fontWeight: 600, lineHeight: 1.5 }}>{useCase.blueprint.persona ?? "Business sponsor"}</div>
        </div>
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "1rem",
            padding: "0.9rem",
            background: "rgba(255,255,255,0.04)",
          }}
        >
          <div style={{ fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: "0.35rem" }}>
            Business KPI
          </div>
          <div style={{ fontWeight: 600, lineHeight: 1.5 }}>{useCase.blueprint.business_kpi ?? "Pilot KPI still being scoped"}</div>
        </div>
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "1rem",
            padding: "0.9rem",
            background: "rgba(255,255,255,0.04)",
          }}
        >
          <div style={{ fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: "0.35rem" }}>
            Pilot scope
          </div>
          <div style={{ fontWeight: 600, lineHeight: 1.5 }}>
            {useCase.blueprint.pilot_scope_weeks ?? 8} week simulator-first sprint
          </div>
        </div>
      </div>

      <div
        style={{
          border: "1px solid rgba(99,102,241,0.18)",
          borderRadius: "1rem",
          padding: "1rem",
          background: "rgba(99,102,241,0.07)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.55rem" }}>
          <FileBadge2 size={14} color="var(--color-glow-primary)" />
          <div style={{ fontSize: "0.76rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-glow-primary)", fontWeight: 700 }}>
            Why this is credible
          </div>
        </div>
        <div style={{ display: "grid", gap: "0.65rem" }}>
          {evidenceItems.map((item) => (
            <div key={item.title} style={{ display: "grid", gap: "0.2rem" }}>
              <div style={{ fontWeight: 700, lineHeight: 1.45 }}>{item.title}</div>
              <div style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)", lineHeight: 1.55 }}>
                {item.claim}
              </div>
              <div style={{ fontSize: "0.74rem", color: "var(--color-text-muted)" }}>
                {item.publisher} · {formatPublishedDate(item.published_at)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
        <button className="btn-ghost" onClick={() => onDetails(useCase)}>
          <Info size={14} /> View Blueprint
        </button>
        <button className="btn-primary" onClick={() => onAssess(useCase)}>
          <SlidersHorizontal size={14} /> Assess Fit
        </button>
        <Link href={`/build?starter=${starter}&use_case_id=${useCase.id}`} className="btn-ghost">
          Open Hybrid Lab <ArrowRight size={14} />
        </Link>
      </div>
    </motion.div>
  );
}

function CatalogUseCaseCard({
  useCase,
  onDetails,
  onAssess,
}: {
  useCase: UseCase;
  onDetails: (useCase: UseCase) => void;
  onAssess: (useCase: UseCase) => void;
}) {
  const starter = getStarterByIndustry(useCase.industry);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.22 }}
      className="glass"
      style={{
        padding: "1.25rem",
        display: "grid",
        gap: "0.9rem",
        height: "100%",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "flex-start" }}>
        <div style={{ display: "grid", gap: "0.25rem" }}>
          <span className="chip" style={{ width: "fit-content", textTransform: "capitalize" }}>
            {useCase.industry}
          </span>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>{useCase.title}</h3>
        </div>
        <span
          className="chip"
          style={{
            background: "rgba(255,255,255,0.06)",
            color: "var(--color-text-secondary)",
            border: "1px solid var(--color-border)",
          }}
        >
          {HORIZON_LABELS[useCase.horizon] ?? useCase.horizon}
        </span>
      </div>

      <p style={{ color: "var(--color-text-secondary)", lineHeight: 1.65, margin: 0 }}>
        {useCase.description}
      </p>

      <div
        style={{
          border: "1px solid rgba(99,102,241,0.16)",
          borderRadius: "0.9rem",
          padding: "0.85rem",
          background: "rgba(99,102,241,0.05)",
        }}
      >
        <div style={{ fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-glow-primary)", fontWeight: 700, marginBottom: "0.35rem" }}>
          Why quantum might help
        </div>
        <div style={{ fontSize: "0.88rem", color: "var(--color-text-secondary)", lineHeight: 1.55 }}>
          {useCase.quantum_approach}
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
        <button className="btn-ghost" onClick={() => onDetails(useCase)}>
          <Info size={14} /> View Details
        </button>
        <button className="btn-primary" onClick={() => onAssess(useCase)}>
          <SlidersHorizontal size={14} /> Assess Fit
        </button>
        <Link href={`/build?starter=${starter}&use_case_id=${useCase.id}`} className="btn-ghost">
          Open Hybrid Lab <ArrowRight size={14} />
        </Link>
      </div>
    </motion.div>
  );
}

function ModalSection({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--color-border)",
        borderRadius: "1rem",
        padding: "1rem",
        background: "rgba(255,255,255,0.04)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.55rem" }}>
        {icon}
        <div style={{ fontSize: "0.76rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-muted)", fontWeight: 700 }}>
          {label}
        </div>
      </div>
      <div style={{ color: "var(--color-text-secondary)", lineHeight: 1.7 }}>{children}</div>
    </div>
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
  const pilotWeeks = useCase.blueprint.pilot_scope_weeks ?? 8;

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
        initial={{ opacity: 0, x: 48 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 48 }}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(680px, 100vw)",
          background: "var(--color-space)",
          borderLeft: "1px solid var(--color-border)",
          zIndex: 101,
          overflowY: "auto",
          padding: "1.5rem",
          display: "grid",
          gap: "1rem",
          alignContent: "start",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
          <div style={{ display: "grid", gap: "0.5rem" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {useCase.featured && (
                <span
                  className="chip"
                  style={{
                    background: "rgba(99,102,241,0.14)",
                    color: "var(--color-glow-primary)",
                    border: "1px solid rgba(99,102,241,0.3)",
                  }}
                >
                  Featured scenario #{useCase.featured_rank}
                </span>
              )}
              <span className="chip" style={{ textTransform: "capitalize" }}>
                {useCase.industry}
              </span>
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>{useCase.title}</h2>
            <p style={{ color: "var(--color-text-secondary)", lineHeight: 1.7, margin: 0 }}>
              {useCase.description}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close use case details"
            style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer" }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          <ModalSection icon={<Info size={14} color="var(--color-glow-primary)" />} label="Persona">
            <strong style={{ color: "var(--color-text-primary)" }}>
              {useCase.blueprint.persona ?? "Business sponsor"}
            </strong>
          </ModalSection>
          <ModalSection icon={<Rocket size={14} color="var(--color-glow-secondary)" />} label="Business KPI">
            {useCase.blueprint.business_kpi ?? "Define the KPI in the pilot charter."}
          </ModalSection>
          <ModalSection icon={<Layers3 size={14} color="var(--color-glow-primary)" />} label="Why classical gets hard">
            {useCase.blueprint.classical_baseline ?? useCase.description}
          </ModalSection>
          <ModalSection icon={<ArrowRight size={14} color="var(--color-glow-secondary)" />} label="Hybrid workflow">
            {useCase.blueprint.hybrid_pattern ?? useCase.quantum_approach}
          </ModalSection>
        </div>

        <ModalSection icon={<FileBadge2 size={14} color="var(--color-glow-primary)" />} label="Why this is credible">
          <div style={{ display: "grid", gap: "0.85rem" }}>
            {useCase.evidence_items.length > 0 ? (
              useCase.evidence_items.map((item) => (
                <div key={item.title} style={{ display: "grid", gap: "0.2rem" }}>
                  <div style={{ color: "var(--color-text-primary)", fontWeight: 700 }}>{item.title}</div>
                  <div>{item.claim}</div>
                  <a
                    href={item.source_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "var(--color-glow-primary)", fontSize: "0.82rem" }}
                  >
                    {item.publisher} · {formatPublishedDate(item.published_at)}
                  </a>
                </div>
              ))
            ) : (
              <div>No public evidence items are attached to this use case yet.</div>
            )}
          </div>
        </ModalSection>

        <ModalSection icon={<CheckCircle2 size={14} color="var(--color-glow-secondary)" />} label={`${pilotWeeks}-week pilot scope`}>
          <div style={{ display: "grid", gap: "0.8rem" }}>
            <div>
              <strong style={{ color: "var(--color-text-primary)" }}>Sample input:</strong>{" "}
              {useCase.blueprint.sample_input ?? "Scoped enterprise dataset"}
            </div>
            <div>
              <strong style={{ color: "var(--color-text-primary)" }}>Success thresholds:</strong>
              <ul style={{ margin: "0.45rem 0 0 1.1rem", padding: 0, display: "grid", gap: "0.35rem" }}>
                {(useCase.blueprint.success_thresholds ?? []).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <strong style={{ color: "var(--color-text-primary)" }}>Next 90 days:</strong>
              <ul style={{ margin: "0.45rem 0 0 1.1rem", padding: 0, display: "grid", gap: "0.35rem" }}>
                {(useCase.blueprint.next_90_days ?? []).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </ModalSection>

        <div style={{ display: "grid", gap: "0.75rem" }}>
          <Link href={`/assess?starter=${starter}&use_case_id=${useCase.id}`} className="btn-primary" style={{ justifyContent: "center" }}>
            Open Assess View <ArrowRight size={14} />
          </Link>
          <Link href={`/build?starter=${starter}&use_case_id=${useCase.id}`} className="btn-ghost" style={{ justifyContent: "center" }}>
            Open Hybrid Lab <ArrowRight size={14} />
          </Link>
          <button className="btn-ghost" onClick={onClose} style={{ justifyContent: "center" }}>
            Close blueprint
          </button>
        </div>
      </motion.div>
    </>
  );
}

export default function ExploreClient() {
  const [industry, setIndustry] = useState<IndustryTag | "all">("all");
  const [showFullCatalog, setShowFullCatalog] = useState(false);
  const [assessTarget, setAssessTarget] = useState<UseCase | null>(null);
  const [detailTarget, setDetailTarget] = useState<UseCase | null>(null);

  const { data, isLoading, isError, error } = useUseCases({
    industry: industry === "all" ? undefined : industry,
    featured_only: !showFullCatalog,
    limit: showFullCatalog ? 50 : 12,
  });

  const items = data?.items ?? [];

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "3rem 1.5rem 6rem" }}>
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <div
          className="chip"
          style={{
            background: "rgba(45,212,191,0.1)",
            color: "var(--color-glow-secondary)",
            border: "1px solid rgba(45,212,191,0.24)",
            marginBottom: "1rem",
          }}
        >
          <Globe size={11} /> Explore
        </div>

        <div
          className="glass"
          style={{
            padding: "1.5rem",
            marginBottom: "1.5rem",
            background:
              "radial-gradient(circle at top right, rgba(99,102,241,0.18), transparent 38%), rgba(9,16,38,0.88)",
          }}
        >
          <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "minmax(0, 1.5fr) minmax(280px, 0.9fr)" }}>
            <div style={{ display: "grid", gap: "0.8rem" }}>
              <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", margin: 0 }}>
                Start with three flagship hybrid scenarios
              </h1>
              <p style={{ color: "var(--color-text-secondary)", lineHeight: 1.75, maxWidth: "58rem", margin: 0 }}>
                Explore now opens with deeper business-ready blueprints instead of a shallow gallery.
                Each featured scenario includes the buyer persona, business KPI, classical baseline,
                hybrid pattern, evidence, and a 6-12 week pilot path.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem" }}>
                <button
                  className={showFullCatalog ? "btn-ghost" : "btn-primary"}
                  onClick={() => setShowFullCatalog(false)}
                >
                  Featured scenarios
                </button>
                <button
                  className={showFullCatalog ? "btn-primary" : "btn-ghost"}
                  onClick={() => setShowFullCatalog(true)}
                >
                  Show full catalog
                </button>
              </div>
            </div>
            <div
              style={{
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "1.25rem",
                padding: "1rem",
                background: "rgba(255,255,255,0.04)",
                display: "grid",
                gap: "0.75rem",
              }}
            >
              <div style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", fontWeight: 700 }}>
                Explore stance
              </div>
              <div style={{ color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
                Default to a smaller set of credible scenarios first, then let people expand into the
                broader atlas when they want the full long-tail catalog.
              </div>
              <div style={{ display: "grid", gap: "0.5rem" }}>
                <div className="chip" style={{ width: "fit-content" }}>
                  3 featured scenarios by default
                </div>
                <div className="chip" style={{ width: "fit-content" }}>
                  Full catalog remains accessible
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "2rem" }}>
          {INDUSTRIES.map(({ value, label, emoji }) => (
            <button
              key={value}
              onClick={() => setIndustry(value)}
              style={{
                padding: "0.42rem 0.9rem",
                borderRadius: "9999px",
                border: `1px solid ${industry === value ? "var(--color-glow-primary)" : "var(--color-border)"}`,
                background: industry === value ? "rgba(99,102,241,0.15)" : "transparent",
                color: industry === value ? "var(--color-glow-primary)" : "var(--color-text-secondary)",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              {emoji} {label}
            </button>
          ))}
        </div>
      </motion.div>

      {isLoading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {Array.from({ length: showFullCatalog ? 6 : 3 }).map((_, index) => (
            <div key={index} className="skeleton" style={{ height: showFullCatalog ? "340px" : "420px" }} />
          ))}
        </div>
      )}

      {isError && (
        <div className="glass" style={{ padding: "1.75rem", color: "var(--color-glow-warn)" }}>
          <div style={{ display: "grid", gap: "0.45rem" }}>
            <div style={{ fontWeight: 700 }}>Explore could not load the use-case catalog.</div>
            <div style={{ color: "var(--color-text-secondary)" }}>
              {error instanceof Error ? error.message : "Check whether the backend is running and seeded."}
            </div>
          </div>
        </div>
      )}

      {data && (
        <div style={{ display: "grid", gap: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
                {showFullCatalog ? "Full catalog" : "Featured scenarios"}
              </div>
              <div style={{ color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
                {showFullCatalog
                  ? `${data.total} accessible use cases across the full atlas.`
                  : `${items.length} ranked scenarios with deeper evidence and pilot framing.`}
              </div>
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            {items.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: showFullCatalog
                    ? "repeat(auto-fit, minmax(320px, 1fr))"
                    : "repeat(auto-fit, minmax(360px, 1fr))",
                  gap: "1.5rem",
                }}
              >
                {items.map((useCase) =>
                  showFullCatalog ? (
                    <CatalogUseCaseCard
                      key={useCase.id}
                      useCase={useCase}
                      onDetails={setDetailTarget}
                      onAssess={setAssessTarget}
                    />
                  ) : (
                    <FeaturedUseCaseCard
                      key={useCase.id}
                      useCase={useCase}
                      onDetails={setDetailTarget}
                      onAssess={setAssessTarget}
                    />
                  ),
                )}
              </div>
            ) : (
              <div className="glass" style={{ padding: "1.5rem", color: "var(--color-text-secondary)" }}>
                No use cases match the current filter yet. Try switching industries or opening the full catalog.
              </div>
            )}
          </AnimatePresence>
        </div>
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
