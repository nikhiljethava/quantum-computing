"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, SlidersHorizontal, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { UseCase } from "@/types/api";
import { useCreateAssessment } from "@/lib/hooks";
import { Assessment, AssessmentInputs } from "@/types/api";

// ── Question definitions ───────────────────────────────────────────────────

const QUESTIONS: {
  key: keyof AssessmentInputs;
  label: string;
  hint: string;
  options: { value: string; label: string; sublabel: string }[];
}[] = [
  {
    key: "problem_size",
    label: "How large is the problem space?",
    hint: "Think about the number of variables, states, or data points involved.",
    options: [
      { value: "small", label: "Small", sublabel: "< 1K items / variables" },
      { value: "medium", label: "Medium", sublabel: "1K – 1M items" },
      { value: "large", label: "Large", sublabel: "1M – 1B items" },
      { value: "very_large", label: "Very Large", sublabel: "> 1B items / combinatorial explosion" },
    ],
  },
  {
    key: "data_structure",
    label: "How is the data structured for quantum encoding?",
    hint: "Can your problem be naturally expressed as quantum states?",
    options: [
      { value: "unstructured", label: "Unstructured", sublabel: "Raw / blob data, hard to encode" },
      { value: "structured", label: "Structured", sublabel: "Graphs, matrices, or combinatorial structure" },
      { value: "quantum_native", label: "Quantum Native", sublabel: "Hamiltonian, amplitude arrays, or directly quantum" },
    ],
  },
  {
    key: "classical_hardness",
    label: "How hard is this for classical solvers?",
    hint: "Is the best known classical algorithm already near its limit?",
    options: [
      { value: "easy", label: "Easy", sublabel: "Classical works fine today" },
      { value: "medium", label: "Medium", sublabel: "Classical is workable but slow" },
      { value: "hard", label: "Hard", sublabel: "Classical hits walls at scale" },
      { value: "intractable", label: "Intractable", sublabel: "NP-hard, exponential scaling" },
    ],
  },
  {
    key: "timeline",
    label: "What is your quantum timeline?",
    hint: "When do you need quantum to deliver value?",
    options: [
      { value: "now", label: "Now", sublabel: "Within 12 months — classical still best" },
      { value: "1-2 years", label: "1–2 Years", sublabel: "NISQ / hybrid readiness window" },
      { value: "2-3 years", label: "2–3 Years", sublabel: "Early fault-tolerant era" },
      { value: "5+ years", label: "5+ Years", sublabel: "Fault-tolerant long-term bet" },
    ],
  },
];

// ── Score display ──────────────────────────────────────────────────────────

const VERDICT_COLORS: Record<string, string> = {
  "Strong Quantum Fit": "#2dd4bf",
  "Likely Hybrid Candidate": "#6366f1",
  "Exploratory — Monitor Progress": "#f59e0b",
  "Classical First — Revisit Later": "#94a3b8",
};

function ScoreDisplay({ assessment }: { assessment: Assessment }) {
  const pct = Math.round(assessment.qals_score * 100);
  const color = VERDICT_COLORS[assessment.verdict] ?? "#6366f1";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{ textAlign: "center", padding: "1rem 0" }}
    >
      {/* Score ring */}
      <div style={{ position: "relative", display: "inline-block", marginBottom: "1.25rem" }}>
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--color-nebula)" strokeWidth="10" />
          <circle
            cx="60" cy="60" r="52"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={`${2 * Math.PI * 52}`}
            strokeDashoffset={`${2 * Math.PI * 52 * (1 - assessment.qals_score)}`}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "1.75rem", fontWeight: 800, color }}>{pct}</span>
          <span style={{ fontSize: "0.6rem", color: "var(--color-text-muted)", fontWeight: 600 }}>QALS SCORE</span>
        </div>
      </div>

      <div style={{ fontSize: "1.125rem", fontWeight: 700, color, marginBottom: "0.5rem" }}>
        {assessment.verdict}
      </div>
      <p style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)", maxWidth: "300px", margin: "0 auto 1.5rem", lineHeight: 1.6 }}>
        QALS-lite is a transparent readiness heuristic — not a claim of quantum advantage.
        Use it as a starting signal for deeper evaluation.
      </p>

      {/* Breakdown */}
      <div style={{ textAlign: "left" }}>
        {Object.entries(assessment.score_breakdown).map(([dim, val]) => (
          <div key={dim} style={{ marginBottom: "0.625rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "3px" }}>
              <span style={{ color: "var(--color-text-secondary)", textTransform: "capitalize" }}>
                {dim.replace("_", " ")}
              </span>
              <span style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>
                {(val * 100).toFixed(1)}%
              </span>
            </div>
            <div style={{ height: "4px", background: "var(--color-nebula)", borderRadius: "2px" }}>
              <div
                style={{
                  width: `${Math.min((val / 0.3) * 100, 100)}%`,
                  height: "100%",
                  background: color,
                  borderRadius: "2px",
                  transition: "width 0.8s ease",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────

export function AssessModal({
  useCase,
  onClose,
}: {
  useCase: UseCase;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const [inputs, setInputs] = useState<Partial<AssessmentInputs>>({});
  const [result, setResult] = useState<Assessment | null>(null);

  const { mutateAsync, isPending, isError } = useCreateAssessment();
  const currentQ = QUESTIONS[step];

  async function handleSelect(value: string) {
    const updated = { ...inputs, [currentQ.key]: value } as AssessmentInputs;
    setInputs(updated);

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      // All questions answered — submit
      try {
        const assessment = await mutateAsync({ use_case_id: useCase.id, user_inputs: updated });
        setResult(assessment);
      } catch (_) {
        // error shown via isError
      }
    }
  }

  return (
    <>
      {/* Backdrop */}
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

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 40 }}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(480px, 100vw)",
          background: "var(--color-space)",
          borderLeft: "1px solid var(--color-border)",
          zIndex: 101,
          overflowY: "auto",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
          <div>
            <div className="chip" style={{ background: "rgba(99,102,241,0.1)", color: "var(--color-glow-primary)", border: "1px solid rgba(99,102,241,0.2)", marginBottom: "0.5rem" }}>
              <SlidersHorizontal size={11} /> QALS-lite Assessment
            </div>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, lineHeight: 1.3 }}>{useCase.title}</h2>
          </div>
          <button
            onClick={onClose}
            id="assess-modal-close"
            style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", padding: "0.25rem" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress bar */}
        {!result && (
          <div style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--color-text-muted)", marginBottom: "6px" }}>
              <span>Question {step + 1} of {QUESTIONS.length}</span>
              <span>{Math.round(((step) / QUESTIONS.length) * 100)}%</span>
            </div>
            <div style={{ height: "3px", background: "var(--color-nebula)", borderRadius: "2px" }}>
              <div style={{ width: `${(step / QUESTIONS.length) * 100}%`, height: "100%", background: "linear-gradient(90deg, var(--color-glow-primary), var(--color-glow-secondary))", borderRadius: "2px", transition: "width 0.3s ease" }} />
            </div>
          </div>
        )}

        {/* Content */}
        {result ? (
          <ScoreDisplay assessment={result} />
        ) : isPending ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "3rem 0", color: "var(--color-text-secondary)" }}>
            <Loader2 size={32} className="pulse-glow" style={{ color: "var(--color-glow-primary)", animation: "spin 1s linear infinite" }} />
            <span>Running QALS-lite…</span>
          </div>
        ) : isError ? (
          <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--color-glow-warn)" }}>
            <AlertCircle size={24} style={{ marginBottom: "0.5rem" }} />
            <p>Assessment failed. Is the backend running?</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.375rem" }}>
                {currentQ.label}
              </h3>
              <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
                {currentQ.hint}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {currentQ.options.map((opt) => (
                  <button
                    key={opt.value}
                    id={`assess-opt-${opt.value}`}
                    onClick={() => handleSelect(opt.value)}
                    style={{
                      padding: "0.875rem 1rem",
                      borderRadius: "0.75rem",
                      border: "1px solid var(--color-border)",
                      background: "transparent",
                      textAlign: "left",
                      cursor: "pointer",
                      color: "var(--color-text-primary)",
                      transition: "border-color 0.15s, background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-glow-primary)";
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(99,102,241,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border)";
                      (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{opt.label}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: "2px" }}>{opt.sublabel}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Back button */}
        {!result && step > 0 && !isPending && (
          <button
            onClick={() => setStep(step - 1)}
            className="btn-ghost"
            style={{ marginTop: "auto", paddingTop: "2rem", alignSelf: "flex-start" }}
          >
            ← Back
          </button>
        )}
      </motion.div>
    </>
  );
}
