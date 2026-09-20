"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  JOBS, CONFLICT_EDGES, enumerateScheduling,
  evaluateSampling, evaluateScheduling, evaluateRouting, evaluatePhase, evaluateLoss,
  type ModelObservation,
} from "@/lib/article4/models";
import type { LessonId } from "@/lib/article4/state";

type Save = (lesson: LessonId, result: ModelObservation) => void;
const format = (n: number) => n !== 0 && Math.abs(n) < 0.00001
  ? n.toExponential(3) : n.toLocaleString("en-US", { maximumFractionDigits: 6 });

function Diagram({ label, children, height = 210 }: { label: string; children: (width: number) => ReactNode; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(560);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(180, entry.contentRect.width)));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return <div className="a4-diagram" ref={ref}><svg role="img" aria-label={label} viewBox={`0 0 ${width} ${height}`} width="100%" height={height}><title>{label}</title>{children(width)}</svg></div>;
}

function Field({ id, label, value, change, error, hint, integer = false }: {
  id: string; label: string; value: string; change: (value: string) => void; error?: string; hint: string; integer?: boolean;
}) {
  return <div className="a4-field"><label htmlFor={id}>{label}</label><input id={id} type="text" inputMode={integer ? "numeric" : "decimal"} autoComplete="off" value={value} onChange={e => change(e.target.value)} aria-invalid={Boolean(error)} aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`} /><span id={`${id}-hint`} className="a4-muted">{hint}</span>{error && <p className="a4-error" id={`${id}-error`} role="alert">{error}</p>}</div>;
}

function Results({ items }: { items: Array<[string, string | number]> }) {
  return <dl className="a4-results">{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{typeof value === "number" ? format(value) : value}</dd></div>)}</dl>;
}

function SaveButton({ valid, onClick }: { valid: boolean; onClick: () => void }) {
  return <div className="a4-save-row"><button className="a4-button a4-primary" type="button" disabled={!valid} onClick={onClick}>Save this example</button><span className="a4-muted">{valid ? "Save a snapshot of these inputs and results." : "Correct the inputs before saving."}</span></div>;
}

function SamplingExplorer({ save }: { save: Save }) {
  const [input, setInput] = useState({ N: "100", b: "0.2", variance: "1", reference: "0" });
  const change = (key: keyof typeof input, value: string) => setInput(prev => ({ ...prev, [key]: value }));
  const evaluated = evaluateSampling(input), errors = evaluated.ok ? {} : evaluated.errors;
  const result = evaluated.ok ? evaluated.value : null;
  return <section aria-label="Sampling tool">
    <div className="a4-tool-heading"><h3>Sampling versus bias</h3><span>Normalized teaching units</span></div>
    <div className="a4-fields"><Field id="sampling-N" label="Number of samples, N" value={input.N} change={v => change("N", v)} error={errors.N} integer hint="Integer from 1 to 10,000,000." /><Field id="sampling-b" label="Fixed offset, b" value={input.b} change={v => change("b", v)} error={errors.b} hint="−1,000 to 1,000 teaching units." /></div>
    <div className="a4-presets" aria-label="Sample count presets">{[100, 1000, 10000].map(n => <button type="button" key={n} onClick={() => change("N", String(n))}>{format(n)} samples</button>)}</div>
    <details className="a4-advanced"><summary>Advanced sampling controls</summary><div className="a4-fields"><Field id="sampling-variance" label="Single-sample variance" value={input.variance} change={v => change("variance", v)} error={errors.variance} hint="0 to 1,000,000 squared teaching units." /><Field id="sampling-reference" label="Reference value" value={input.reference} change={v => change("reference", v)} error={errors.reference} hint="−1,000 to 1,000 teaching units." /></div></details>
    {!evaluated.ok && <p className="a4-error" role="status">No result is shown while an input is invalid. Check the primary and advanced controls.</p>}
    {result && <>
      <figure><Diagram label={`Reference ${format(result.inputs.reference)}. Expected estimate ${format(result.outputs.expectedEstimate)}. One standard error ${format(result.outputs.standardError)}.`}>{width => {
        const { reference } = result.inputs, { expectedEstimate: mean, standardError: se } = result.outputs;
        const span = Math.max(se * 4, Math.abs(mean - reference) * .3, .1), low = Math.min(reference, mean) - span, high = Math.max(reference, mean) + span;
        const x = (v: number) => 24 + (v - low) / (high - low) * (width - 48);
        const curve = (center: number) => Array.from({ length: 121 }, (_, i) => { const value = center - 4 * se + i / 120 * 8 * se; return `${i ? "L" : "M"}${x(value)},${170 - 120 * Math.exp(-.5 * ((value - center) / se) ** 2)}`; }).join(" ");
        return <>
          <line x1={24} y1={170} x2={width - 24} y2={170} className="a4-axis" />
          <line x1={x(reference)} y1={20} x2={x(reference)} y2={170} stroke="var(--a4-teal)" strokeDasharray="4 4" />
          {se > 0 ? <><rect x={x(mean - se)} y={30} width={x(mean + se) - x(mean - se)} height={140} fill="var(--a4-indigo)" opacity=".1" /><path d={curve(reference)} fill="none" stroke="var(--a4-teal)" strokeWidth={2} strokeDasharray="5 4" /><path d={curve(mean)} fill="none" stroke="var(--a4-indigo)" strokeWidth={2.5} /></> : <><circle cx={x(reference)} cy={170} r={7} fill="var(--a4-teal)" /><path d={`M${x(mean)},150 l8,8 -8,8 -8,-8 Z`} fill="var(--a4-indigo)" /></>}
          {[low, (low + high) / 2, high].map((v, i) => <text key={i} x={x(v)} y={194} textAnchor={i === 0 ? "start" : i === 2 ? "end" : "middle"}>{format(v)}</text>)}
        </>;
      }}</Diagram><figcaption>Dashed teal: reference-centered spread. Solid indigo: shifted spread. The shaded band is ± one standard error, not a guaranteed accuracy interval. {result.outputs.standardError === 0 ? "Zero variance is shown as points." : "Curve heights are normalized for this schematic; the vertical axis is not a probability scale."}</figcaption></figure>
      <Results items={[["Reference", result.inputs.reference], ["Expected estimate", result.outputs.expectedEstimate], ["Standard error", result.outputs.standardError], ["Mean squared error", result.outputs.meanSquaredError]]} />
      <p className="a4-result-sentence" aria-live="polite">{result.outputs.standardError === 0 ? "With zero variance, this model has no sampling spread to narrow. The expected estimate is the reference plus the fixed offset." : result.outputs.offsetDirection === "equal" ? "This model has no fixed offset. More samples narrow sampling uncertainty around the reference." : `More samples narrow the uncertainty. The expected estimate remains ${result.outputs.offsetDirection} the reference because this model includes a fixed offset.`}</p>
    </>}
    <SaveButton valid={Boolean(result)} onClick={() => { if (result) save("sampling", result); }} />
  </section>;
}

function SchedulingExplorer({ save }: { save: Save }) {
  const [selected, setSelected] = useState<string[]>(["A", "C"]);
  const [checked, setChecked] = useState(false);
  const evaluated = evaluateScheduling(selected);
  if (!evaluated.ok) return <p role="alert">The job selection could not be evaluated.</p>;
  const result = evaluated.value, out = result.outputs;
  const choices = enumerateScheduling(), validChoices = choices.filter(choice => choice.valid), maximumChoices = choices.filter(choice => choice.maximum);
  return <section aria-label="Scheduling tool">
    <div className="a4-tool-heading"><h3>Five-job scheduling</h3><span>Classical calculation</span></div>
    <fieldset className="a4-job-selection"><legend>Select jobs for one time slot</legend>{JOBS.map(job => <label key={job.id}><input type="checkbox" checked={selected.includes(job.id)} onChange={() => setSelected(prev => prev.includes(job.id) ? prev.filter(j => j !== job.id) : [...prev, job.id])} /><strong>{job.id}</strong><span>{job.equipment.join(", ")}</span></label>)}</fieldset>
    <figure><Diagram height={250} label={`Selected jobs ${selected.join(", ") || "none"}; ${out.conflicts.length} conflicts.`}>{width => {
      const radius = Math.min(90, width / 2 - 26), points = Object.fromEntries(JOBS.map((job, i) => [job.id, [width / 2 + radius * Math.cos(-Math.PI / 2 + i * 2 * Math.PI / 5), 126 + radius * Math.sin(-Math.PI / 2 + i * 2 * Math.PI / 5)]]));
      return <>{CONFLICT_EDGES.map(edge => { const [a, b] = edge.jobs, [x1, y1] = points[a], [x2, y2] = points[b], bad = selected.includes(a) && selected.includes(b); return <line key={a + b} x1={x1} y1={y1} x2={x2} y2={y2} stroke={bad ? "var(--a4-error)" : "var(--a4-line)"} strokeWidth={bad ? 3 : 2} strokeDasharray={bad ? "5 3" : undefined} />; })}{JOBS.map(job => { const [x, y] = points[job.id], active = selected.includes(job.id); return <g key={job.id}><circle cx={x} cy={y} r={21} fill={active ? "var(--a4-indigo)" : "white"} stroke="var(--a4-line)" /><text x={x} y={y + 4} textAnchor="middle" style={{ fill: active ? "white" : "var(--a4-ink)" }}>{job.id}{active ? " ✓" : ""}</text></g>; })}</>;
    }}</Diagram><figcaption>Each edge represents shared equipment. A checked node is selected; a dashed red edge marks a selected conflicting pair.</figcaption></figure>
    <div className="a4-equipment"><h4>Equipment in this selection</h4>{selected.length ? <ul>{JOBS.filter(j => selected.includes(j.id)).map(job => <li key={job.id}>{job.id}: {job.equipment.join(", ")}</li>)}</ul> : <p>No equipment is reserved.</p>}</div>
    <Results items={[["Selected jobs", out.selectedCount], ["Conflicting pairs", out.conflicts.length], ["Selection", out.valid ? out.maximum ? "Valid and maximum" : "Valid, not maximum" : "Invalid"]]} />
    <div className="a4-result-sentence" aria-live="polite">{out.conflicts.length ? <ul>{out.conflicts.map(c => <li key={c.jobs.join("")}>{c.jobs.join(" + ")} is invalid because both need {c.equipment.join(" and ")}.</li>)}</ul> : <p>{selected.length ? selected.slice().sort().join(" + ") : "The empty selection"} is valid. {out.maximum ? "It is also maximum: no valid selection has more than two jobs." : "It is not maximum; a valid two-job selection is possible."}</p>}</div>
    <button type="button" className="a4-button" onClick={() => setChecked(true)}>Check all choices</button>
    {checked && <div className="a4-enumeration"><p>All {choices.length} subsets checked classically. There are {validChoices.length} valid subsets, including the empty set. The maximum size is {out.maximumSize}: {maximumChoices.map(choice => choice.selected.join("")).join(", ")}.</p><table><caption>Every choice in the five-job example</caption><thead><tr><th scope="col">Selection</th><th scope="col">Conflicts</th><th scope="col">Result</th></tr></thead><tbody>{choices.map(row => <tr key={row.selected.join("") || "empty"}><th scope="row">{row.selected.join("") || "Empty"}</th><td>{row.conflicts.map(c => `${c.jobs.join("+")}: ${c.equipment.join(", ")}`).join("; ") || "None"}</td><td>{row.maximum ? "Valid, maximum" : row.valid ? "Valid" : "Invalid"}</td></tr>)}</tbody></table></div>}
    <SaveButton valid onClick={() => save("scheduling", result)} />
  </section>;
}

function RoutingExplorer({ save }: { save: Save }) {
  const [input, setInput] = useState({ k: "1", localTime: "0.2", directTime: "1" });
  const change = (key: keyof typeof input, value: string) => setInput(prev => ({ ...prev, [key]: value }));
  const evaluated = evaluateRouting(input), errors = evaluated.ok ? {} : evaluated.errors, result = evaluated.ok ? evaluated.value : null;
  return <section aria-label="Routing tool"><div className="a4-tool-heading"><h3>Routing overhead</h3><span>Illustrative time units</span></div>
    <div className="a4-fields"><Field id="routing-k" label="Number of SWAPs, k" value={input.k} change={v => change("k", v)} error={errors.k} integer hint="Integer from 0 to 5." /><Field id="routing-localTime" label="Local operation time" value={input.localTime} change={v => change("localTime", v)} error={errors.localTime} hint="0 to 1,000,000 illustrative time units." /><Field id="routing-directTime" label="Illustrative direct operation time" value={input.directTime} change={v => change("directTime", v)} error={errors.directTime} hint="0 to 1,000,000 illustrative time units." /></div>
    {result && <><figure><Diagram label={`Fixed sites. Initial states ${result.outputs.arrangements[0].join(", ")}; final states ${result.outputs.arrangements.at(-1)!.join(", ")}.`} height={210}>{width => {
      const before = result.outputs.arrangements[0], after = result.outputs.arrangements.at(-1)!;
      return <>{[before, after].map((arrangement, row) => <g key={row}><text x={6} y={row ? 118 : 20}>{row ? `After ${result.inputs.k} SWAPs` : "Before"}</text><line x1={22} y1={row ? 156 : 58} x2={width - 22} y2={row ? 156 : 58} className="a4-axis" />{arrangement.map((label, i) => { const x = 22 + i / (arrangement.length - 1) * (width - 44), y = row ? 156 : 58, radius = Math.min(20, (width - 44) / arrangement.length / 2); return <g key={i}><rect x={x - radius} y={y - 20} width={radius * 2} height={40} rx={7} fill="white" stroke="var(--a4-line)" /><text x={x} y={y + 4} textAnchor="middle" style={{ fill: label === "A" ? "var(--a4-teal)" : "var(--a4-ink)" }}>{label}</text><text x={x} y={y + 36} textAnchor="middle" className="a4-small-label">{i + 1}</text></g>; })}</g>)}</>;
    }}</Diagram><figcaption>Numbered hardware sites stay fixed. The state labels move. This CNOT-based strategy does not restore the original arrangement.</figcaption></figure>
    <Results items={[["Local two-qubit gates", result.outputs.gateCount], ["Local gate-only duration", result.outputs.localDuration], ["Direct gate-only duration", result.outputs.directDuration]]} />
    <p className="a4-result-sentence" aria-live="polite">{result.outputs.comparison === "tie" ? "The gate-only durations are equal in this model." : result.outputs.comparison === "local-faster" ? "The local strategy has the shorter gate-only duration in this model." : "The illustrative direct operation has the shorter gate-only duration in this model."} These invented timings omit transport, parallelism, readout, reset, and errors.</p>
    <details className="a4-advanced"><summary>Read the state arrangements</summary><ol>{result.outputs.arrangements.map((arr, i) => <li key={i}>{i === 0 ? "Initial" : `After SWAP ${i}`}: {arr.join(", ")}</li>)}</ol></details></>}
    <SaveButton valid={Boolean(result)} onClick={() => { if (result) save("routing", result); }} />
  </section>;
}

function OpticsExplorer({ panel, navigate, save }: { panel: "phase" | "loss"; navigate: (lesson: LessonId) => void; save: Save }) {
  const [phi, setPhi] = useState(String(Math.PI / 2));
  const [efficiencies, setEfficiencies] = useState(["0.9", "0.9", "0.9", "0.9"]);
  const [launches, setLaunches] = useState("100");
  const phase = evaluatePhase({ phi }), loss = evaluateLoss({ efficiencies, launches });
  const phaseResult = phase.ok ? phase.value : null, lossResult = loss.ok ? loss.value : null;
  return <section aria-label="Optics tool"><div className="a4-tool-heading"><h3>Optics</h3><span>Two separate educational calculations</span></div>
    <div className="a4-presets" aria-label="Optics panels"><button type="button" aria-pressed={panel === "phase"} onClick={() => navigate("photonics")}>Phase panel</button><button type="button" aria-pressed={panel === "loss"} onClick={() => navigate("loss")}>Loss panel</button></div>
    <section hidden={panel !== "phase"} aria-label="Optics phase panel"><div className="a4-fields"><Field id="optics-phi" label="Phase, φ (radians)" value={phi} change={setPhi} error={phase.ok ? undefined : phase.errors.phi} hint="From 0 to π radians." /></div><div className="a4-presets">{[[0, "0"], [Math.PI / 2, "π/2"], [Math.PI, "π"]].map(([v, label]) => <button type="button" key={v} onClick={() => setPhi(String(v))}>{label}</button>)}</div>
      {phaseResult && <><figure><Diagram label={`One photon in two path amplitudes. Ideal probabilities D0 ${format(phaseResult.outputs.pD0)}, D1 ${format(phaseResult.outputs.pD1)}.`}>{width => {
        const s = width * .23, e = width * .73;
        return <><circle cx={16} cy={65} r={6} fill="var(--a4-teal)" /><line x1={22} y1={65} x2={s} y2={65} stroke="var(--a4-teal)" strokeWidth={2} /><path d={`M${s},65 L${s + 20},28 H${e - 20} L${e},65 M${s},65 L${s + 20},102 H${e - 20} L${e},65`} fill="none" stroke="var(--a4-indigo)" strokeWidth={2} /><path d={`M${e},65 L${width - 16},28 M${e},65 L${width - 16},102`} fill="none" stroke="var(--a4-line)" strokeWidth={2} /><text x={width / 2} y={69} textAnchor="middle">φ = {format(phaseResult.inputs.phi)}</text>{[["D0", phaseResult.outputs.pD0], ["D1", phaseResult.outputs.pD1]].map(([label, v], i) => <g key={label}><text x={0} y={151 + i * 32}>{label}: {format(Number(v) * 100)}%</text><rect x={105} y={139 + i * 32} width={Math.max(0, (width - 110) * Number(v))} height={16} rx={3} fill={i ? "var(--a4-indigo)" : "var(--a4-teal)"} /></g>)}</>;
      }}</Diagram><figcaption>The two paths carry amplitudes of one photon, not two copies. Each phase setting describes fresh preparations.</figcaption></figure><Results items={[["P(D0)", phaseResult.outputs.pD0], ["P(D1)", phaseResult.outputs.pD1]]} /><p className="a4-result-sentence" aria-live="polite">These are ideal probabilities in a balanced, lossless interferometer. They are not observed counts.</p></>}
      <SaveButton valid={Boolean(phaseResult)} onClick={() => { if (phaseResult) save("photonics", phaseResult); }} />
    </section>
    <section hidden={panel !== "loss"} aria-label="Optics loss panel"><div className="a4-fields">{efficiencies.map((value, i) => <Field key={i} id={`optics-efficiency${i}`} label={`Stage ${i + 1} conditional efficiency`} value={value} change={v => setEfficiencies(prev => prev.map((e, j) => j === i ? v : e))} error={loss.ok ? undefined : loss.errors[`efficiency${i}`]} hint="Fraction from 0 to 1, conditional on arrival." />)}<Field id="optics-launches" label="Number of launches" value={launches} change={setLaunches} error={loss.ok ? undefined : loss.errors.launches} integer hint="Integer from 0 to 1,000,000,000." /></div>
      {lossResult && <><figure><Diagram label={`Expected counts from launch through four stages: ${lossResult.outputs.stageCounts.map(format).join(", ")}.`} height={230}>{width => <>{lossResult.outputs.stageCounts.map((count, i) => <g key={i}><text x={0} y={25 + i * 42}>{i ? `Stage ${i}` : "Launched"}</text><rect x={80} y={11 + i * 42} width={lossResult.inputs.launches === 0 ? 0 : Math.max(0, width - 178) * count / lossResult.inputs.launches} height={19} rx={3} fill={i ? "var(--a4-indigo)" : "var(--a4-teal)"} opacity={1 - i * .1} /><text x={width - 2} y={25 + i * 42} textAnchor="end">{format(count)}</text></g>)}</>}</Diagram><figcaption>Expected surviving counts after each stage. Fractional values are expectations, not observed photon counts.</figcaption></figure><Results items={[["Path efficiency", lossResult.outputs.pathEfficiency], ["Expected detections", lossResult.outputs.expectedDetections]]} /><table><caption>Expected delivery along the optical path</caption><thead><tr><th scope="col">Stage</th><th scope="col">Expected surviving</th><th scope="col">Expected lost here</th></tr></thead><tbody>{lossResult.outputs.stageCounts.map((count, i) => <tr key={i}><th scope="row">{i ? `Stage ${i}` : "Launch"}</th><td>{format(count)}</td><td>{i ? format(lossResult.outputs.stageLosses[i - 1]) : "—"}</td></tr>)}</tbody></table><p className="a4-result-sentence" aria-live="polite">The path delivers an expected {format(lossResult.outputs.expectedDetections)} detections from {format(lossResult.inputs.launches)} launches. Conditional fidelity is a separate question.</p></>}
      <SaveButton valid={Boolean(lossResult)} onClick={() => { if (lossResult) save("loss", lossResult); }} />
    </section>
  </section>;
}

export function Article4Tools({ lessonId, save, navigate }: { lessonId: LessonId; save: Save; navigate: (lesson: LessonId) => void }) {
  return <div className="a4-tools">
    <div hidden={lessonId !== "sampling"}><SamplingExplorer save={save} /></div>
    <div hidden={lessonId !== "scheduling"}><SchedulingExplorer save={save} /></div>
    <div hidden={lessonId !== "routing"}><RoutingExplorer save={save} /></div>
    <div hidden={lessonId !== "photonics" && lessonId !== "loss"}><OpticsExplorer panel={lessonId === "loss" ? "loss" : "phase"} navigate={navigate} save={save} /></div>
  </div>;
}
