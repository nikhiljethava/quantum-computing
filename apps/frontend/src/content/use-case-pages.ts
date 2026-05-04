import type { LessonPath } from "@/content/lessons";

export const HARDWARE_ACCESS_NOTE =
  "Google quantum hardware access is restricted to approved groups. Quantum Foundry is simulation-first unless approved access is configured.";

export type GoogleStackItem =
  | "Cirq"
  | "qsim"
  | "OpenFermion"
  | "Google Colab"
  | "Vertex AI Gemini"
  | "Cloud Run"
  | "Cloud Run Jobs"
  | "Cloud Storage"
  | "BigQuery"
  | "Cloud SQL"
  | "Cloud Tasks";

export type MaturityLabel =
  | "learn_now"
  | "simulate_now"
  | "pilot_carefully"
  | "research_only"
  | "future_fault_tolerant_required"
  | "approved_hardware_access_only";

export type UseCasePage = {
  slug: string;
  title: string;
  industry: string;
  maturityLabel: MaturityLabel;
  valueProposition: string;
  businessProblem: string;
  classicalBaseline: string;
  quantumApproach: string;
  simulateToday: string[];
  futureHardwarePath: string[];
  googleStack: GoogleStackItem[];
  evidence: {
    title: string;
    publisher: string;
    publishedAt: string;
    claim: string;
    sourceUrl: string;
  }[];
  recommendedLessons: { label: string; path: LessonPath; slug: string }[];
  recommendedLabs: { label: string; starter: "coin_flip" | "bell_state" | "grover" | "routing" | "chemistry" }[];
  architectureNotes: string[];
  hardwareAccessNote: string;
};

export const USE_CASE_PAGES: UseCasePage[] = [
  {
    slug: "portfolio-optimization",
    title: "Portfolio Optimization",
    industry: "finance",
    maturityLabel: "simulate_now",
    valueProposition:
      "Explore constrained allocation as a simulator-first hybrid workflow, with classical baselines kept visible.",
    businessProblem:
      "Investment teams need to rebalance portfolios across risk, return, liquidity, and policy constraints without hiding the assumptions behind a black-box optimizer.",
    classicalBaseline:
      "Classical solvers and Monte Carlo methods remain the production baseline. They become difficult when teams add many coupled constraints, scenario paths, and explainability requirements.",
    quantumApproach:
      "Use Cirq to teach QAOA-style cost and mixer intuition, then compare toy quantum-inspired outputs with classical optimization baselines.",
    simulateToday: [
      "Create a small QAOA-style routing or allocation circuit.",
      "Run ideal and educational noisy histograms in the Cirq Lab.",
      "Export a Colab notebook for repeatable stakeholder review.",
    ],
    futureHardwarePath: [
      "Near-term work should stay benchmark-focused and simulator-first.",
      "Any hardware path needs approved access, a tiny scoped instance, and a classical benchmark plan.",
    ],
    googleStack: [
      "Cirq",
      "qsim",
      "Google Colab",
      "Vertex AI Gemini",
      "Cloud Run Jobs",
      "Cloud Storage",
      "BigQuery",
    ],
    evidence: [
      {
        title: "Quantum algorithms for portfolio optimization",
        publisher: "Nature Scientific Reports",
        publishedAt: "2022-07-05",
        claim:
          "Public research frames portfolio optimization as a common quantum optimization benchmark, while keeping practical advantage claims scoped.",
        sourceUrl: "https://www.nature.com/articles/s41598-022-14756-3",
      },
      {
        title: "Financial use cases for quantum computing",
        publisher: "Google Quantum AI ecosystem",
        publishedAt: "2024-01-01",
        claim:
          "Finance examples are best treated as hybrid research and simulation exercises before any production claim.",
        sourceUrl: "https://quantumai.google/",
      },
    ],
    recommendedLessons: [
      { label: "QAOA intuition", path: "algorithms", slug: "qaoa-intuition" },
      { label: "Measurement histograms", path: "cirq", slug: "measurement-histograms" },
      { label: "Cloud Run Jobs", path: "google-cloud", slug: "cloud-run-jobs" },
    ],
    recommendedLabs: [{ label: "Toy routing optimization", starter: "routing" }],
    architectureNotes: [
      "Use BigQuery for scenario inputs and classical baseline output.",
      "Run bounded simulator jobs through Cloud Run Jobs.",
      "Store notebooks, histograms, and assessment JSON in Cloud Storage.",
    ],
    hardwareAccessNote: HARDWARE_ACCESS_NOTE,
  },
  {
    slug: "molecular-docking-drug-design",
    title: "Molecular Docking & Drug Design",
    industry: "pharma",
    maturityLabel: "pilot_carefully",
    valueProposition:
      "Use chemistry learning content and tiny toy circuits to frame where quantum simulation may matter later.",
    businessProblem:
      "Discovery teams need better ways to reason about molecular interactions, binding hypotheses, and active-space choices while preserving scientific review.",
    classicalBaseline:
      "Classical docking, molecular dynamics, and statistical screening remain the working baseline. Complexity rises with electron correlation, conformational search, and validation burden.",
    quantumApproach:
      "Use OpenFermion-oriented lessons and Cirq toy circuits to teach Hamiltonian thinking. Keep v1 as education and pilot design, not a fake drug discovery engine.",
    simulateToday: [
      "Walk through a toy chemistry sketch in Build.",
      "Explain Hamiltonian and active-space vocabulary.",
      "Map the workflow to Cloud Run, Cloud Storage, and Colab artifacts.",
    ],
    futureHardwarePath: [
      "Chemistry advantage claims require stronger algorithms, larger logical qubit counts, and carefully validated scientific benchmarks.",
      "Approved hardware access would still be only one part of a much larger scientific workflow.",
    ],
    googleStack: [
      "Cirq",
      "OpenFermion",
      "Google Colab",
      "Cloud Run Jobs",
      "Cloud Storage",
      "BigQuery",
    ],
    evidence: [
      {
        title: "OpenFermion: The electronic structure package for quantum computers",
        publisher: "Quantum Science and Technology",
        publishedAt: "2020-01-09",
        claim:
          "OpenFermion provides Google-native tooling for representing electronic structure problems for quantum simulation research.",
        sourceUrl: "https://quantumai.google/openfermion",
      },
      {
        title: "Quantum chemistry in the age of quantum computing",
        publisher: "Chemical Reviews",
        publishedAt: "2019-03-13",
        claim:
          "Chemistry is a serious long-term quantum simulation area, but useful business pilots must separate education from advantage claims.",
        sourceUrl: "https://pubs.acs.org/doi/10.1021/acs.chemrev.8b00803",
      },
    ],
    recommendedLessons: [
      { label: "Why chemistry is hard", path: "openfermion", slug: "why-chemistry-is-hard" },
      { label: "Hamiltonians", path: "openfermion", slug: "hamiltonians" },
      { label: "Simulation-first architecture", path: "google-cloud", slug: "simulation-first-architecture" },
    ],
    recommendedLabs: [{ label: "Toy chemistry sketch", starter: "chemistry" }],
    architectureNotes: [
      "Use BigQuery or Cloud Storage for curated molecular metadata and experiment manifests.",
      "Keep simulator jobs separate from notebook review loops.",
      "Treat artifacts as educational decision records, not clinical or discovery outputs.",
    ],
    hardwareAccessNote: HARDWARE_ACCESS_NOTE,
  },
  {
    slug: "vehicle-routing-optimization",
    title: "Vehicle Routing Optimization",
    industry: "logistics",
    maturityLabel: "simulate_now",
    valueProposition:
      "Turn routing constraints into a toy optimization lab that business teams can understand and compare against classical heuristics.",
    businessProblem:
      "Logistics teams balance routes, capacity, time windows, emissions, and service levels under changing demand.",
    classicalBaseline:
      "Classical heuristics and mixed-integer optimization are the baseline. Difficulty appears when constraints multiply and the decision surface changes quickly.",
    quantumApproach:
      "Use a small QAOA-style circuit to teach the hybrid pattern: classical data in, quantum-inspired kernel, classical scoring out.",
    simulateToday: [
      "Run a toy routing optimization starter in Build.",
      "Compare ideal and educational noisy histograms.",
      "Map the workflow to Cloud Run Jobs and Cloud Storage exports.",
    ],
    futureHardwarePath: [
      "Production routing should stay classical unless a benchmarked hybrid method earns its place.",
      "Hardware exploration requires approved access and a small validation instance.",
    ],
    googleStack: [
      "Cirq",
      "qsim",
      "Google Colab",
      "Cloud Run Jobs",
      "Cloud Storage",
      "BigQuery",
      "Cloud Tasks",
    ],
    evidence: [
      {
        title: "QAOA for combinatorial optimization",
        publisher: "arXiv",
        publishedAt: "2014-11-14",
        claim:
          "QAOA established a hybrid variational pattern for combinatorial optimization, which is useful for toy education and benchmark design.",
        sourceUrl: "https://arxiv.org/abs/1411.4028",
      },
      {
        title: "Vehicle routing problem research landscape",
        publisher: "Operations research literature",
        publishedAt: "2023-01-01",
        claim:
          "Vehicle routing remains a classically mature but constraint-heavy optimization domain where hybrid experiments can be framed carefully.",
        sourceUrl: "https://en.wikipedia.org/wiki/Vehicle_routing_problem",
      },
    ],
    recommendedLessons: [
      { label: "QAOA intuition", path: "algorithms", slug: "qaoa-intuition" },
      { label: "qsim overview", path: "qsim", slug: "qsim-overview" },
      { label: "Cloud Run Jobs", path: "google-cloud", slug: "cloud-run-jobs" },
    ],
    recommendedLabs: [{ label: "Toy routing optimization", starter: "routing" }],
    architectureNotes: [
      "Use BigQuery for route and demand inputs.",
      "Use Cloud Tasks or Cloud Run Jobs to queue bounded simulation runs.",
      "Export route scoring summaries to Cloud Storage for review.",
    ],
    hardwareAccessNote: HARDWARE_ACCESS_NOTE,
  },
];

export const USE_CASE_PAGE_BY_SLUG = new Map(USE_CASE_PAGES.map((item) => [item.slug, item]));

export function getUseCasePage(slug: string): UseCasePage | undefined {
  return USE_CASE_PAGE_BY_SLUG.get(slug);
}
