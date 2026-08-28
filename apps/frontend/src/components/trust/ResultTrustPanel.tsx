import { AlertTriangle, CheckCircle2, Gauge, ShieldCheck } from "lucide-react";

import type { ResultTrust } from "@/types/api";

function display(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "Not recorded";
  return typeof value === "number" ? value.toLocaleString() : value.replaceAll("_", " ");
}

function formatTimestamp(value: string | null): string {
  if (!value) return "Not recorded";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

function sectionId(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function safeExternalUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function resultTypeStyle(resultType: ResultTrust["result_type"] | undefined): string {
  if (resultType === "Vendor Reported") return "border-[#fed7aa] bg-[#fff7ed] text-[#c2410c]";
  if (resultType === "Independently Reproduced") return "border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]";
  if (resultType === "Hardware Measured") return "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]";
  if (resultType === "Tutorial" || resultType === "Simulation") return "border-[#ddd6fe] bg-[#f5f3ff] text-[#6d28d9]";
  return "border-slate-300 bg-slate-100 text-slate-700";
}

function TrustList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div>
      <div className="text-xs font-bold uppercase text-slate-400">{title}</div>
      <ul className="mt-2 grid gap-2 text-sm leading-6 text-slate-600">
        {(items.length ? items : [empty]).map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ResultTrustPanel({
  trust,
  title = "Result Trust",
  embedded = false,
}: {
  trust: ResultTrust | null;
  title?: string;
  embedded?: boolean;
}) {
  if (!trust) return null;

  const resultType = trust.result_type ?? "Unknown";
  const sourceUrl = safeExternalUrl(trust.source_link);

  const metrics = [
    ["Result type", resultType],
    ["Evidence category", trust.evidence_category],
    ["Backend", trust.backend],
    ["Simulator / hardware", trust.hardware_or_simulator_name],
    ["Status", trust.execution_status],
    ["Estimate level", trust.estimate_level],
    ["Hardware horizon", trust.hardware_horizon],
    ["Qubits", trust.qubit_count],
    ["Circuit depth", trust.circuit_depth],
    ["1Q gates", trust.one_qubit_gate_count],
    ["2Q gates", trust.two_qubit_gate_count],
    ["Shots", trust.shots],
    ["Ideal / noisy", trust.ideal_or_noisy],
    ["Baseline", trust.classical_baseline_status],
    ["Contract validity", trust.contract_validity_status],
    ["Verdict", trust.readiness_verdict],
    ["Confidence", trust.confidence],
    ["Time horizon", trust.time_horizon],
  ] as const;

  const distribution = trust.result_distribution
    .map((entry) => ({
      state: String(entry.state ?? entry.label ?? "result"),
      probability: typeof entry.probability === "number" ? entry.probability : null,
      count: typeof entry.count === "number" ? entry.count : null,
    }))
    .filter((entry) => entry.probability !== null || entry.count !== null)
    .slice(0, 8);

  const educationalNoise = Boolean(
    trust.noise_model_description?.toLowerCase().includes("educational"),
  );

  return (
    <section
      id={sectionId(title)}
      data-testid="result-trust-panel"
      aria-label={title}
      className={`scroll-mt-28 ${embedded ? "" : "border border-[#d8e2f3] bg-white p-5 shadow-[0_14px_34px_rgba(148,163,184,0.14)]"}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#2563eb]">
            <Gauge className="h-4 w-4" />
            Evidence and execution context
          </div>
          <h2 className="mt-2 text-xl font-black text-slate-950">{title}</h2>
        </div>
        <div className={`inline-flex w-fit items-center gap-2 border px-3 py-2 text-xs font-bold uppercase ${resultTypeStyle(resultType)}`}>
          <ShieldCheck className="h-4 w-4" />
          {resultType}
        </div>
      </div>

      <div className="mt-5 grid gap-px border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([label, value]) => (
          <div key={label} className="min-w-0 bg-[#fbfdff] p-3">
            <div className="text-[11px] font-bold uppercase text-slate-400">{label}</div>
            <div className="mt-2 break-words text-sm font-bold text-slate-800">{display(value)}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="border border-slate-200 bg-[#fbfdff] p-3 text-sm leading-6 text-slate-600">
          <div className="text-xs font-bold uppercase text-slate-400">Noise model</div>
          <div className="mt-2">{trust.noise_model_description ?? "None recorded; ideal simulator path when a simulation exists."}</div>
        </div>
        <div className="border border-slate-200 bg-[#fbfdff] p-3 text-sm leading-6 text-slate-600">
          <div className="text-xs font-bold uppercase text-slate-400">Generated by</div>
          <div className="mt-2">{trust.software_or_model_version ?? "Version not recorded"}</div>
          <div className="mt-1 text-xs text-slate-500">{formatTimestamp(trust.generated_at)}</div>
        </div>
      </div>

      <div className="mt-4 border border-slate-200 bg-[#fbfdff] p-4">
        <div className="text-xs font-bold uppercase text-slate-400">Evidence source</div>
        <div className="mt-3 grid gap-4 text-sm leading-6 text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="text-[11px] font-bold uppercase text-slate-400">Source type</div>
            <div className="mt-1 font-bold text-slate-800">{display(trust.source_type)}</div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase text-slate-400">Organization</div>
            <div className="mt-1 font-bold text-slate-800">{display(trust.source_organization)}</div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase text-slate-400">Published</div>
            <div className="mt-1 font-bold text-slate-800">{formatTimestamp(trust.publication_date)}</div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase text-slate-400">Last verified</div>
            <div className="mt-1 font-bold text-slate-800">{formatTimestamp(trust.last_verified_date)}</div>
          </div>
        </div>
        {trust.claim_status ? (
          <p className="mt-4 border-l-2 border-[#94a3b8] pl-3 text-sm leading-7 text-slate-600">
            {trust.claim_status}
          </p>
        ) : null}
        {sourceUrl ? (
          <a href={sourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-bold text-[#2563eb] underline underline-offset-4">
            Open source record
          </a>
        ) : null}
      </div>

      {distribution.length ? (
        <div className="mt-4 border border-slate-200 bg-[#fbfdff] p-4">
          <div className="text-xs font-bold uppercase text-slate-400">Result distribution</div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {distribution.map((entry) => {
              const value = entry.probability ?? entry.count ?? 0;
              const width = entry.probability !== null ? Math.min(100, Math.max(2, entry.probability)) : 12;
              return (
                <div key={`${entry.state}-${value}`} className="border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-700">
                    <span>{entry.state}</span>
                    <span>{entry.probability !== null ? `${entry.probability}%` : entry.count}</span>
                  </div>
                  <div className="mt-2 h-2 bg-slate-100">
                    <div className="h-2 bg-[#2563eb]" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2" aria-label="Trust labels">
        {trust.trust_labels.map((label) => (
          <span key={label} className="border border-[#c7d2fe] bg-[#eef2ff] px-3 py-1.5 text-xs font-bold uppercase text-[#4338ca]">
            {label.replaceAll("_", " ")}
          </span>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <TrustList title="Assumptions" items={trust.assumptions} empty="No assumptions recorded." />
        <TrustList title="Missing evidence" items={trust.missing_evidence} empty="No missing evidence recorded." />
        <TrustList title="Caveats" items={trust.caveats} empty="No caveats recorded." />
        <TrustList title="Provenance" items={trust.provenance} empty="No provenance recorded." />
      </div>

      <div className={`mt-5 flex items-start gap-3 border p-3 text-sm leading-6 ${educationalNoise ? "border-[#fed7aa] bg-[#fff7ed] text-[#9a3412]" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
        {educationalNoise ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0f766e]" />}
        <span>
          {educationalNoise
            ? "This noise model is educational, not calibrated hardware noise."
            : "This panel describes evidence and simulation trust. It is not QCVV or hardware characterization."}
        </span>
      </div>
    </section>
  );
}
