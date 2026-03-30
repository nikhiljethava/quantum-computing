export type StarterKey =
  | "coin_flip"
  | "bell_state"
  | "grover"
  | "routing"
  | "chemistry";

export interface CircuitVisualNode {
  type: "gate" | "control" | "target" | "measure" | "label";
  lane: number;
  column: number;
  label?: string;
  targetLane?: number;
  tone?: "primary" | "secondary" | "accent" | "warn" | "neutral";
}

export interface AssessmentPreview {
  score: number;
  verdict: string;
  horizon: string;
  confidence: string;
  explanation: string[];
  assumptions: string[];
  publicSignals: string[];
  nextAction: string;
}

export interface ArchitectureNode {
  id: string;
  label: string;
  caption: string;
  tone: "primary" | "secondary" | "accent" | "warn";
}

export interface StarterStory {
  key: StarterKey;
  label: string;
  badge: string;
  concept: string;
  prompt: string;
  guideIntro: string;
  guideReply: string;
  guideFollowUp: string;
  explanation: string;
  useCaseHint: string;
  wires: string[];
  circuit: CircuitVisualNode[];
  histogram: Array<{ state: string; probability: number; tone: "primary" | "secondary" | "accent" | "warn" }>;
  code: string;
  assessment: AssessmentPreview;
  architectureSummary: string;
  architectureNodes: ArchitectureNode[];
  optionalNode?: ArchitectureNode;
  exportItems: string[];
}

const STORIES: Record<StarterKey, StarterStory> = {
  coin_flip: {
    key: "coin_flip",
    label: "Quantum Coin Flip",
    badge: "Primer favorite",
    concept: "Superposition",
    prompt:
      "Create a toy circuit that behaves like a quantum coin flip, then show how I would prototype it on Google Cloud.",
    guideIntro:
      "The guide should keep the language concrete: one qubit, one gate, one measurement, and one simulator-first path.",
    guideReply:
      "I will prepare a single-qubit circuit with a Hadamard gate, simulate a 50/50 measurement outcome, and keep the architecture path fully simulator-first.",
    guideFollowUp:
      "From here, we can switch to Bell state, Grover toy search, routing optimization, or a chemistry sketch without leaving the workspace.",
    explanation:
      "Hadamard creates the 'coin in the air' state. Measurement collapses that superposition into either 0 or 1, which is why the distribution lands close to 50/50.",
    useCaseHint: "Good for learning flows, workshops, and first-run customer demos.",
    wires: ["q0", "c0"],
    circuit: [
      { type: "gate", lane: 0, column: 0, label: "H", tone: "primary" },
      { type: "measure", lane: 0, column: 2, label: "M", tone: "secondary" },
      { type: "label", lane: 1, column: 2, label: "readout", tone: "neutral" },
    ],
    histogram: [
      { state: "0", probability: 49, tone: "primary" },
      { state: "1", probability: 51, tone: "accent" },
    ],
    code: `import cirq

q0 = cirq.LineQubit(0)
circuit = cirq.Circuit(
    cirq.H(q0),
    cirq.measure(q0, key="result"),
)

simulator = cirq.Simulator()
result = simulator.run(circuit, repetitions=1000)
print(result.histogram(key="result"))`,
    assessment: {
      score: 72,
      verdict: "Credible prototype candidate now",
      horizon: "Hybrid experiment now",
      confidence: "Medium confidence",
      explanation: [
        "Educational demos are easy to explain and run entirely on simulation.",
        "The workflow maps cleanly to a hybrid cloud story without implying hardware access.",
        "This is best positioned as a launchpad artifact, not as business advantage.",
      ],
      assumptions: [
        "Stakeholders want intuition and a clear learning path.",
        "A single-circuit demo is enough for the first customer conversation.",
      ],
      publicSignals: [
        "Use for executive briefings, workshops, and first-run field demos.",
        "Pairs well with architecture exports and guided concept cards.",
      ],
      nextAction: "Pair the circuit with a short architecture brief and one exportable session summary.",
    },
    architectureSummary:
      "Use a lightweight simulator-first path: data comes from Cloud Storage or BigQuery, the backend prepares the circuit, a Cirq + qsim worker executes it, and post-processing packages the results for export.",
    architectureNodes: [
      { id: "data", label: "BigQuery / Cloud Storage", caption: "Source and session context", tone: "primary" },
      { id: "prep", label: "Vertex AI preprocessing", caption: "Prompt shaping and metadata", tone: "secondary" },
      { id: "worker", label: "Cirq + qsim worker", caption: "Simulation layer", tone: "accent" },
      { id: "post", label: "Post-process and scoring", caption: "Charts, notes, and exports", tone: "secondary" },
    ],
    optionalNode: {
      id: "hardware",
      label: "Google QCS (optional)",
      caption: "Feature-gated later path",
      tone: "warn",
    },
    exportItems: ["Cirq notebook", "Assessment JSON", "Architecture brief", "Decision memo"],
  },
  bell_state: {
    key: "bell_state",
    label: "Bell State",
    badge: "Entanglement demo",
    concept: "Entanglement",
    prompt: "Show a Bell state and explain why the two measurements stay correlated.",
    guideIntro:
      "This should feel like a visual teaching moment, not like a blank coding exercise.",
    guideReply:
      "I will create a two-qubit Bell pair with one Hadamard and one CNOT so the user can see how entanglement produces correlated measurements.",
    guideFollowUp:
      "We can compare this to the coin-flip circuit or move toward a toy workflow that looks more like a business prototype.",
    explanation:
      "The first qubit is placed into superposition and then linked to the second with a CNOT gate. That makes the outcomes correlated: 00 and 11 dominate the result.",
    useCaseHint: "Strong for teaching what makes quantum behavior feel different from classical randomness.",
    wires: ["q0", "q1", "c0"],
    circuit: [
      { type: "gate", lane: 0, column: 0, label: "H", tone: "primary" },
      { type: "control", lane: 0, column: 2, tone: "primary", targetLane: 1 },
      { type: "target", lane: 1, column: 2, tone: "primary" },
      { type: "measure", lane: 0, column: 4, label: "M", tone: "secondary" },
      { type: "measure", lane: 1, column: 4, label: "M", tone: "secondary" },
    ],
    histogram: [
      { state: "00", probability: 48, tone: "primary" },
      { state: "11", probability: 47, tone: "accent" },
      { state: "01", probability: 3, tone: "secondary" },
      { state: "10", probability: 2, tone: "warn" },
    ],
    code: `import cirq

q0, q1 = cirq.LineQubit.range(2)
circuit = cirq.Circuit(
    cirq.H(q0),
    cirq.CNOT(q0, q1),
    cirq.measure(q0, q1, key="bell"),
)

simulator = cirq.Simulator()
result = simulator.run(circuit, repetitions=1000)
print(result.histogram(key="bell"))`,
    assessment: {
      score: 68,
      verdict: "Great guided demo now",
      horizon: "Hybrid experiment now",
      confidence: "High confidence",
      explanation: [
        "Entanglement is a strong educational moment for non-specialists.",
        "The workflow is still simulation-first and easy to package into a workshop.",
        "It is better suited for understanding than for direct enterprise ROI claims.",
      ],
      assumptions: [
        "The audience wants intuition before business qualification.",
        "The demo is framed honestly as a learning artifact.",
      ],
      publicSignals: [
        "Useful for onboarding PMs, architects, and field teams.",
        "Works well when paired with a simple GCP architecture map.",
      ],
      nextAction: "Use Bell state as the bridge from Learn into Explore and Assess.",
    },
    architectureSummary:
      "The architecture remains mostly identical to the coin-flip path, but the guide explains how the two-qubit state and correlated measurements fit inside the simulation worker.",
    architectureNodes: [
      { id: "data", label: "Cloud Storage session state", caption: "Saved prompts and notes", tone: "primary" },
      { id: "prep", label: "Classical pre-processing", caption: "Circuit selection and narration", tone: "secondary" },
      { id: "worker", label: "Cirq entanglement worker", caption: "Bell pair simulation", tone: "accent" },
      { id: "post", label: "Result interpretation", caption: "Correlation view and exports", tone: "secondary" },
    ],
    optionalNode: {
      id: "hardware",
      label: "Approved hardware adapter",
      caption: "Not enabled by default",
      tone: "warn",
    },
    exportItems: ["Bell-state notebook", "Teaching notes", "Architecture JSON", "Session summary"],
  },
  grover: {
    key: "grover",
    label: "Grover Toy Search",
    badge: "Search example",
    concept: "Amplitude amplification",
    prompt: "Show a toy Grover search and explain why the marked state becomes more likely.",
    guideIntro:
      "The point is not to overclaim speedup. The point is to make search intuition visible and honest.",
    guideReply:
      "I will use a small two-qubit Grover example to show how the oracle and diffuser increase the probability of the marked state.",
    guideFollowUp:
      "Once the user sees the amplification pattern, we can compare it to classical search and talk through realistic time horizons.",
    explanation:
      "Grover's oracle flips the marked state and the diffuser amplifies it. After one iteration in a small search space, the target state becomes visibly more probable.",
    useCaseHint: "Good for showing why some workloads are discussed as quantum candidates rather than guaranteed wins.",
    wires: ["q0", "q1", "c0"],
    circuit: [
      { type: "gate", lane: 0, column: 0, label: "H", tone: "primary" },
      { type: "gate", lane: 1, column: 0, label: "H", tone: "primary" },
      { type: "gate", lane: 0, column: 2, label: "O", tone: "accent" },
      { type: "gate", lane: 1, column: 2, label: "O", tone: "accent" },
      { type: "gate", lane: 0, column: 4, label: "D", tone: "secondary" },
      { type: "gate", lane: 1, column: 4, label: "D", tone: "secondary" },
      { type: "measure", lane: 0, column: 6, label: "M", tone: "secondary" },
      { type: "measure", lane: 1, column: 6, label: "M", tone: "secondary" },
    ],
    histogram: [
      { state: "11", probability: 78, tone: "primary" },
      { state: "01", probability: 9, tone: "secondary" },
      { state: "10", probability: 7, tone: "accent" },
      { state: "00", probability: 6, tone: "warn" },
    ],
    code: `import cirq

q0, q1 = cirq.LineQubit.range(2)
circuit = cirq.Circuit(
    cirq.H.on_each(q0, q1),
    cirq.CZ(q0, q1),  # oracle for |11>
    cirq.H.on_each(q0, q1),
    cirq.X.on_each(q0, q1),
    cirq.CZ(q0, q1),
    cirq.X.on_each(q0, q1),
    cirq.H.on_each(q0, q1),
    cirq.measure(q0, q1, key="search"),
)`,
    assessment: {
      score: 64,
      verdict: "Explainable research path",
      horizon: "Hardware-gated later",
      confidence: "Medium confidence",
      explanation: [
        "The algorithm is strong for intuition and search-style storytelling.",
        "Real business relevance depends heavily on the structure of the search problem.",
        "This is where honest caveats matter most: educational value now, selective workload fit later.",
      ],
      assumptions: [
        "The problem can be represented as a search over a structured state space.",
        "Stakeholders accept that this is still a toy example.",
      ],
      publicSignals: [
        "Best positioned as a concept bridge from education into readiness scoring.",
        "Use when explaining why quantum discussions focus on narrow kernels.",
      ],
      nextAction: "Keep the explanation anchored to time horizon and missing assumptions.",
    },
    architectureSummary:
      "The architecture adds more emphasis on the narrow quantum kernel: classical systems define the search space, the simulator runs a toy oracle path, and post-processing compares outcomes to a baseline.",
    architectureNodes: [
      { id: "data", label: "Structured search data", caption: "Candidate state space", tone: "primary" },
      { id: "prep", label: "Classical kernel shaping", caption: "Oracle inputs and baseline", tone: "secondary" },
      { id: "worker", label: "Grover simulation worker", caption: "Narrow quantum step", tone: "accent" },
      { id: "post", label: "Compare vs baseline", caption: "Interpret amplified states", tone: "secondary" },
    ],
    optionalNode: {
      id: "hardware",
      label: "Hardware exploration later",
      caption: "Feature-gated after validation",
      tone: "warn",
    },
    exportItems: ["Grover circuit code", "Search explanation", "Assessment bundle", "Architecture map"],
  },
  routing: {
    key: "routing",
    label: "Toy Routing Optimization",
    badge: "Optimization workflow",
    concept: "QAOA-style optimization",
    prompt: "Show a toy routing optimization example and map it to a hybrid Google Cloud workflow.",
    guideIntro:
      "This is the closest thing to a buyer-facing prototype in the current set, so the app should feel more solution-oriented here.",
    guideReply:
      "I will use a QAOA-style toy circuit to represent a small routing problem, then show the classical prep, quantum kernel, and post-processing loop in one workspace.",
    guideFollowUp:
      "If you want to make this more credible, the next step is to assess the workload honestly rather than claim advantage.",
    explanation:
      "The circuit starts in superposition, encodes a simplified routing cost with ZZ interactions, and uses mixer rotations to explore candidate solutions before measurement.",
    useCaseHint: "Closest to the storyboard's enterprise prototype story for logistics and portfolio-style optimization.",
    wires: ["q0", "q1", "q2", "c0"],
    circuit: [
      { type: "gate", lane: 0, column: 0, label: "H", tone: "primary" },
      { type: "gate", lane: 1, column: 0, label: "H", tone: "primary" },
      { type: "gate", lane: 2, column: 0, label: "H", tone: "primary" },
      { type: "control", lane: 0, column: 2, tone: "accent", targetLane: 1 },
      { type: "control", lane: 1, column: 4, tone: "accent", targetLane: 2 },
      { type: "gate", lane: 0, column: 6, label: "Rx", tone: "secondary" },
      { type: "gate", lane: 1, column: 6, label: "Rx", tone: "secondary" },
      { type: "gate", lane: 2, column: 6, label: "Rx", tone: "secondary" },
      { type: "measure", lane: 0, column: 8, label: "M", tone: "secondary" },
      { type: "measure", lane: 1, column: 8, label: "M", tone: "secondary" },
      { type: "measure", lane: 2, column: 8, label: "M", tone: "secondary" },
    ],
    histogram: [
      { state: "010", probability: 41, tone: "primary" },
      { state: "101", probability: 35, tone: "accent" },
      { state: "001", probability: 14, tone: "secondary" },
      { state: "111", probability: 10, tone: "warn" },
    ],
    code: `import cirq
import numpy as np

q0, q1, q2 = cirq.LineQubit.range(3)
gamma = 0.5
beta = 0.3

circuit = cirq.Circuit(
    cirq.H.on_each(q0, q1, q2),
    cirq.ZZPowGate(exponent=gamma / np.pi)(q0, q1),
    cirq.ZZPowGate(exponent=gamma / np.pi)(q1, q2),
    cirq.rx(2 * beta)(q0),
    cirq.rx(2 * beta)(q1),
    cirq.rx(2 * beta)(q2),
    cirq.measure(q0, q1, q2, key="route"),
)`,
    assessment: {
      score: 79,
      verdict: "Credible prototype candidate now",
      horizon: "Hybrid experiment now",
      confidence: "Medium confidence",
      explanation: [
        "Optimization workflows map naturally to a hybrid split with strong classical scaffolding.",
        "The prototype path is easy to explain: prep data, isolate a narrow kernel, compare against a baseline.",
        "This is still a toy example, but it is the strongest enterprise-facing story in the current mock set.",
      ],
      assumptions: [
        "The routing subproblem is narrow enough to isolate from the full workflow.",
        "Stakeholders understand that simulation comes first and hardware remains optional.",
      ],
      publicSignals: [
        "Scheduling and routing are common public-facing optimization narratives.",
        "This fits PM and architect conversations better than a pure concept demo.",
      ],
      nextAction: "Attach a QALS-lite explanation and an exportable architecture brief for follow-up.",
    },
    architectureSummary:
      "Classical systems prepare the routing instance, a Cirq + qsim worker handles the toy quantum kernel, and post-processing scores candidate routes before packaging results for notebooks and briefs.",
    architectureNodes: [
      { id: "data", label: "BigQuery / Cloud Storage", caption: "Orders, routes, and constraints", tone: "primary" },
      { id: "prep", label: "Vertex AI preprocessing", caption: "Classical filtering and scoring", tone: "secondary" },
      { id: "worker", label: "Cirq + qsim worker", caption: "QAOA-style kernel", tone: "accent" },
      { id: "post", label: "Post-process and scoring", caption: "Classical ranking loop", tone: "secondary" },
    ],
    optionalNode: {
      id: "hardware",
      label: "Google QCS (optional)",
      caption: "Only for approved access paths",
      tone: "warn",
    },
    exportItems: ["Routing notebook", "Architecture brief", "Starter Terraform", "Decision memo"],
  },
  chemistry: {
    key: "chemistry",
    label: "Toy Chemistry Sketch",
    badge: "Placeholder chemistry path",
    concept: "VQE structure",
    prompt: "Create a toy chemistry placeholder that shows how a VQE-style workflow could look without overclaiming.",
    guideIntro:
      "The chemistry path should be explicit about what is real, what is illustrative, and what is intentionally stubbed.",
    guideReply:
      "I will show a small VQE-style ansatz sketch, explain what OpenFermion would add later, and keep the readiness language careful.",
    guideFollowUp:
      "This is the right place to say 'placeholder' instead of pretending the toy circuit solves real molecular design.",
    explanation:
      "The ansatz prepares a tiny variational circuit that resembles the shape of a VQE workflow. It is useful for explanation, but not a substitute for full chemistry tooling.",
    useCaseHint: "Useful when the conversation starts in batteries, industrial chemistry, or drug discovery.",
    wires: ["q0", "q1", "c0"],
    circuit: [
      { type: "gate", lane: 0, column: 0, label: "X", tone: "primary" },
      { type: "gate", lane: 0, column: 2, label: "Ry", tone: "accent" },
      { type: "control", lane: 0, column: 4, tone: "primary", targetLane: 1 },
      { type: "gate", lane: 0, column: 6, label: "Ry", tone: "secondary" },
      { type: "control", lane: 0, column: 8, tone: "primary", targetLane: 1 },
      { type: "measure", lane: 0, column: 10, label: "M", tone: "secondary" },
      { type: "measure", lane: 1, column: 10, label: "M", tone: "secondary" },
    ],
    histogram: [
      { state: "10", probability: 38, tone: "primary" },
      { state: "11", probability: 33, tone: "accent" },
      { state: "00", probability: 17, tone: "secondary" },
      { state: "01", probability: 12, tone: "warn" },
    ],
    code: `import cirq

q0, q1 = cirq.LineQubit.range(2)
theta = 0.123

circuit = cirq.Circuit(
    cirq.X(q0),
    cirq.ry(theta)(q0),
    cirq.CNOT(q0, q1),
    cirq.ry(-theta)(q0),
    cirq.CNOT(q0, q1),
    cirq.measure(q0, q1, key="energy"),
)`,
    assessment: {
      score: 66,
      verdict: "Research now, hardware later",
      horizon: "Research now",
      confidence: "Lower confidence",
      explanation: [
        "Chemistry is one of the most credible long-term quantum themes, but the path from toy circuit to enterprise value is still narrow.",
        "This workflow is best framed as a guided prototype and education aid.",
        "OpenFermion and richer problem formulation would be the next layer, not something to fake in v1.",
      ],
      assumptions: [
        "The user needs a teaching bridge, not a production chemistry stack.",
        "The app can clearly label stubs and missing scientific detail.",
      ],
      publicSignals: [
        "Chemistry and materials appear often in public quantum narratives.",
        "Best used with careful caveats and a clear roadmap label.",
      ],
      nextAction: "Keep the placeholder visible and point deeper users to future OpenFermion-backed extensions.",
    },
    architectureSummary:
      "Chemistry uses the same simulator-first backbone, with stronger emphasis on classical preprocessing and future OpenFermion hooks before any hardware-aware path is discussed.",
    architectureNodes: [
      { id: "data", label: "Scientific data sources", caption: "Molecular inputs and metadata", tone: "primary" },
      { id: "prep", label: "Classical preprocessing", caption: "Hamiltonian prep and feature shaping", tone: "secondary" },
      { id: "worker", label: "VQE sketch worker", caption: "Toy ansatz simulation", tone: "accent" },
      { id: "post", label: "Notebook and export layer", caption: "Interpretation and notes", tone: "secondary" },
    ],
    optionalNode: {
      id: "hardware",
      label: "Future hardware adapter",
      caption: "Roadmap only",
      tone: "warn",
    },
    exportItems: ["Chemistry notebook stub", "Assumption log", "Architecture JSON", "Session summary"],
  },
};

export const STARTER_ORDER: StarterKey[] = [
  "coin_flip",
  "bell_state",
  "grover",
  "routing",
  "chemistry",
];

export function normalizeStarterKey(value?: string | null): StarterKey {
  if (!value) return "coin_flip";
  const lowered = value.toLowerCase();
  if (lowered in STORIES) return lowered as StarterKey;
  if (lowered === "bell") return "bell_state";
  if (lowered === "search") return "grover";
  if (lowered === "optimization") return "routing";
  return "coin_flip";
}

export function getStarterStory(value?: string | null): StarterStory {
  return STORIES[normalizeStarterKey(value)];
}

export function getStarterByIndustry(industry: string): StarterKey {
  switch (industry) {
    case "logistics":
    case "finance":
      return "routing";
    case "materials":
    case "pharma":
      return "chemistry";
    case "energy":
      return "grover";
    default:
      return "bell_state";
  }
}
