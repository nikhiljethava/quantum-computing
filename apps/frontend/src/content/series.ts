import type { EvidenceSourceType, ProblemClass, ResultType } from "@/types/api";

export interface EvidenceRecord {
  id: string;
  sourceType: EvidenceSourceType;
  title: string;
  organization: string;
  url: string | null;
  publishedAt: string | null;
  lastVerifiedAt: string;
  claimSupported: string;
  resultType: ResultType;
  notes: string;
}

export interface SeriesArticle {
  id: string;
  slug: string;
  sequence: number;
  title: string;
  subtitle: string;
  summary: string;
  canonicalArticleUrl: string | null;
  heroAsset: string | null;
  status: "PUBLISHED" | "DRAFT";
  publishedAt: string | null;
  relatedArticleSlugs: string[];
}

export interface PlatformLayer {
  id: string;
  label: string;
  whatItDoes: string;
  whyItMatters: string;
  example: string;
  existsToday: string;
  stillDeveloping: string;
  evidenceStatus: string;
}

export interface HybridStep {
  id: string;
  label: string;
  description: string;
  executionKind: "classical" | "simulated quantum" | "optional approved hardware" | "future only";
}

export interface InteractionModel {
  id: "batch" | "iterative" | "tight" | "future";
  label: string;
  summary: string;
  example: string;
  maturity: string;
  trustLabel: string;
}

export type InteractiveModule =
  | {
      kind: "PLATFORM_ARCHITECTURE";
      layers: PlatformLayer[];
    }
  | {
      kind: "HYBRID_WORKFLOW";
      steps: HybridStep[];
      interactionModels: InteractionModel[];
    };

export interface ArticleCompanion {
  articleSlug: string;
  simpleExplanation: string;
  technicalExplanation: string;
  interactiveModule: InteractiveModule;
  guidedExampleId: string;
  glossary: Array<{ term: string; definition: string }>;
  evidenceRecords: EvidenceRecord[];
  relatedAssessmentDefaults: {
    source: "series-01" | "series-02";
    problemClass: ProblemClass;
    goal: "learning" | "benchmarking" | "research" | "operational";
  };
  nextArticleSlug: string | null;
}

function configuredArticleUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

const article01Url = configuredArticleUrl(process.env.NEXT_PUBLIC_SERIES_ARTICLE_01_URL);
const article02Url = configuredArticleUrl(process.env.NEXT_PUBLIC_SERIES_ARTICLE_02_URL);

export const SERIES_ARTICLES: SeriesArticle[] = [
  {
    id: "series-01",
    slug: "01-platform-problem",
    sequence: 1,
    title: "Quantum Computing Has a Platform Problem",
    subtitle: "A processor is only one part of a trustworthy quantum workflow.",
    summary:
      "Follow a problem from definition through software, hybrid execution, control, evidence, and a defensible decision.",
    canonicalArticleUrl: article01Url,
    heroAsset: null,
    status: "PUBLISHED",
    publishedAt: null,
    relatedArticleSlugs: ["02-hybrid-computing"],
  },
  {
    id: "series-02",
    slug: "02-hybrid-computing",
    sequence: 2,
    title: "Why Quantum Computing Will Be Hybrid",
    subtitle: "Useful workflows coordinate classical and quantum steps instead of replacing one with the other.",
    summary:
      "Compare batch, iterative, tight-feedback, and future-integrated interaction models through a simulator-first workflow.",
    canonicalArticleUrl: article02Url,
    heroAsset: null,
    status: "PUBLISHED",
    publishedAt: null,
    relatedArticleSlugs: ["01-platform-problem"],
  },
];

const sharedEvidenceDate = "2026-08-26";

export const SERIES_COMPANIONS: ArticleCompanion[] = [
  {
    articleSlug: "01-platform-problem",
    simpleExplanation:
      "Quantum work starts before a circuit and continues after a processor returns samples. The surrounding platform turns a question into an executable, reviewable decision.",
    technicalExplanation:
      "A credible workflow specifies the mathematical object and classical baseline, lowers an algorithm through libraries and compiler layers, coordinates hybrid execution, and preserves provenance and trust through post-processing.",
    interactiveModule: {
      kind: "PLATFORM_ARCHITECTURE",
      layers: [
        {
          id: "problem",
          label: "Problem definition",
          whatItDoes: "States the decision, inputs, constraints, success metric, and time horizon.",
          whyItMatters: "An unclear problem cannot produce a meaningful benchmark or quantum candidate.",
          example: "Choose one molecule fragment and one observable instead of asking to simulate all battery chemistry.",
          existsToday: "Classical requirements, data contracts, and benchmark design are established practices.",
          stillDeveloping: "Reusable translations from broad business goals to quantum-ready mathematical objects.",
          evidenceStatus: "User-declared evidence and assumptions",
        },
        {
          id: "contract",
          label: "Algorithm Contract",
          whatItDoes: "Connects the problem, baseline, algorithm family, required inputs, maturity, and hard gates.",
          whyItMatters: "It prevents a prepared demo from silently becoming a recommendation for a real workload.",
          example: "A VQE contract names the Hamiltonian path, ansatz, optimizer, observable, and DFT baseline.",
          existsToday: "Quantum Foundry uses deterministic QALS 3.0 rules for this contract.",
          stillDeveloping: "Stronger domain-specific evidence templates and independently reviewed benchmark protocols.",
          evidenceStatus: "Deterministic personal-project methodology",
        },
        {
          id: "software",
          label: "Libraries and compiler",
          whatItDoes: "Expresses the algorithm and translates it into operations a selected backend understands.",
          whyItMatters: "The same algorithm can have very different resource costs after decomposition and routing.",
          example: "OpenFermion constructs a molecular Hamiltonian and Cirq represents the resulting circuit.",
          existsToday: "Frameworks, domain libraries, compilers, and intermediate representations are available now.",
          stillDeveloping: "Portable optimizations and dependable resource estimates across changing targets.",
          evidenceStatus: "Official documentation plus tutorial examples",
        },
        {
          id: "runtime",
          label: "Hybrid runtime",
          whatItDoes: "Schedules classical preparation, simulator or approved hardware work, and classical post-processing.",
          whyItMatters: "Latency, retries, parameter loops, queues, and provenance often dominate the operational design.",
          example: "A classical optimizer submits repeated VQE parameter sets to a simulator worker.",
          existsToday: "Batch and iterative simulator workflows are practical today.",
          stillDeveloping: "Tighter hardware feedback and fault-tolerant distributed execution.",
          evidenceStatus: "Architecture estimate",
        },
        {
          id: "compute",
          label: "CPU, GPU, simulator, and QPU",
          whatItDoes: "Provides the compute resources used by each stage of the workflow.",
          whyItMatters: "Simulation is classical computation; a QPU is optional, access-controlled, and not interchangeable with a simulator.",
          example: "CPU preprocessing, a GPU-backed qsim run, then CPU verification of the histogram.",
          existsToday: "Classical compute and simulators are broadly available; selected QPU access exists under provider controls.",
          stillDeveloping: "Large, error-corrected systems capable of broad fault-tolerant workloads.",
          evidenceStatus: "Simulator-first; hardware claims require separate evidence",
        },
        {
          id: "control",
          label: "Control and error management",
          whatItDoes: "Turns logical operations into timed physical control and detects or mitigates errors.",
          whyItMatters: "An ideal circuit diagram omits calibration, noise, decoding, and control-system constraints.",
          example: "Educational depolarizing noise illustrates sensitivity but is not calibrated device noise.",
          existsToday: "Control stacks, calibration, error mitigation, and early error-correction experiments exist.",
          stillDeveloping: "Scalable fault tolerance with sustained logical computation.",
          evidenceStatus: "Educational explanation, not QCVV",
        },
        {
          id: "decision",
          label: "Evidence and decision",
          whatItDoes: "Compares results with the baseline and records limitations, provenance, trust labels, and the next decision.",
          whyItMatters: "A histogram alone does not establish business value, production readiness, or quantum advantage.",
          example: "A toy QAOA result becomes a benchmark candidate with a required OR-Tools comparison.",
          existsToday: "Structured benchmark reporting and evidence review can be done now.",
          stillDeveloping: "More independently reproduced, application-level quantum benchmark evidence.",
          evidenceStatus: "Result Trust required",
        },
      ],
    },
    guidedExampleId: "coin_flip",
    glossary: [
      { term: "Algorithm Contract", definition: "A structured agreement about the problem, baseline, algorithm, evidence, constraints, and allowed next action." },
      { term: "Backend", definition: "The simulator or approved hardware target that executes a quantum program." },
      { term: "Compiler", definition: "Software that translates and optimizes a program for a target instruction set or device." },
      { term: "QPU", definition: "A quantum processing unit. Quantum Foundry does not expose public QPU execution." },
      { term: "Result Trust", definition: "The visible execution, evidence, provenance, and limitation context attached to a result." },
    ],
    evidenceRecords: [
      {
        id: "series-01-analysis",
        sourceType: "PERSONAL_ANALYSIS",
        title: "Beyond the Quantum Processor: platform model",
        organization: "Quantum Foundry personal project",
        url: article01Url,
        publishedAt: null,
        lastVerifiedAt: sharedEvidenceDate,
        claimSupported: "A processor must be evaluated as part of a wider software, runtime, control, and evidence system.",
        resultType: "Estimated",
        notes: "Conceptual architecture, not a measured hardware benchmark.",
      },
      {
        id: "series-01-tutorial",
        sourceType: "TUTORIAL",
        title: "Quantum Foundry simulator walkthrough",
        organization: "Quantum Foundry personal project",
        url: null,
        publishedAt: null,
        lastVerifiedAt: sharedEvidenceDate,
        claimSupported: "A small circuit can illustrate the platform stages without implying production value.",
        resultType: "Tutorial",
        notes: "Cirq-first educational simulation with no public hardware execution.",
      },
    ],
    relatedAssessmentDefaults: {
      source: "series-01",
      problemClass: "UNKNOWN",
      goal: "learning",
    },
    nextArticleSlug: "02-hybrid-computing",
  },
  {
    articleSlug: "02-hybrid-computing",
    simpleExplanation:
      "Quantum programs usually depend on classical work before, during, or after the quantum step. The useful unit is the coordinated workflow, not the processor in isolation.",
    technicalExplanation:
      "Hybrid execution ranges from asynchronous batch jobs to repeated variational loops and future tight-feedback systems. Each model has different latency, orchestration, error-management, and hardware assumptions.",
    interactiveModule: {
      kind: "HYBRID_WORKFLOW",
      steps: [
        { id: "prepare", label: "Classical preparation", description: "Validate the problem, baseline, data, parameters, and contract.", executionKind: "classical" },
        { id: "simulate", label: "Simulator validation", description: "Run a small Cirq/qsim model and inspect resource and trust metrics.", executionKind: "simulated quantum" },
        { id: "hardware", label: "Optional QPU execution", description: "A separately approved branch, never the public default.", executionKind: "optional approved hardware" },
        { id: "optimize", label: "Classical optimization or verification", description: "Update parameters or compare outputs with the declared baseline.", executionKind: "classical" },
        { id: "trust", label: "Result and trust assessment", description: "Record provenance, caveats, maturity, and the next evidence-backed decision.", executionKind: "classical" },
      ],
      interactionModels: [
        { id: "batch", label: "Batch", summary: "Classical work finishes before and after a queued quantum job.", example: "Prepare one circuit, run it on a simulator, then analyze the histogram.", maturity: "Practical on simulators today", trustLabel: "TOY_SIMULATION" },
        { id: "iterative", label: "Iterative", summary: "Classical and quantum steps repeat over several parameter-update rounds.", example: "A VQE or QAOA optimizer evaluates a parameterized circuit repeatedly.", maturity: "Research and benchmark candidate", trustLabel: "CONVERGENCE_UNCERTAIN" },
        { id: "tight", label: "Tight or real-time", summary: "Classical feedback is required during or very close to quantum execution.", example: "Fast decoding and control feedback during an error-correction cycle.", maturity: "Hardware-gated and workload-specific", trustLabel: "HARDWARE_GATED" },
        { id: "future", label: "Future integrated", summary: "A future model with fault-tolerant and distributed execution across tightly coordinated resources.", example: "Long logical computations with continuous decoding and distributed classical services.", maturity: "Future fault-tolerant horizon", trustLabel: "FTQC_LATER" },
      ],
    },
    guidedExampleId: "chemistry",
    glossary: [
      { term: "Batch", definition: "An interaction model where classical preparation and analysis surround a queued quantum job." },
      { term: "Variational loop", definition: "A repeated cycle where a classical optimizer updates parameters for a quantum circuit." },
      { term: "Simulator", definition: "Classical software that calculates or samples a mathematical model of a quantum program." },
      { term: "Tight feedback", definition: "A workflow requiring low-latency classical decisions close to quantum execution." },
      { term: "Fault tolerance", definition: "Logical quantum computation protected by repeated error detection, decoding, and correction." },
    ],
    evidenceRecords: [
      {
        id: "series-02-analysis",
        sourceType: "PERSONAL_ANALYSIS",
        title: "Beyond the Quantum Processor: hybrid interaction model",
        organization: "Quantum Foundry personal project",
        url: article02Url,
        publishedAt: null,
        lastVerifiedAt: sharedEvidenceDate,
        claimSupported: "Classical and quantum resources play different roles across batch, iterative, tight, and future workflows.",
        resultType: "Estimated",
        notes: "Conceptual workflow; maturity varies by interaction model.",
      },
      {
        id: "series-02-vqe-tutorial",
        sourceType: "TUTORIAL",
        title: "Prepared VQE hybrid-loop example",
        organization: "Quantum Foundry personal project",
        url: null,
        publishedAt: null,
        lastVerifiedAt: sharedEvidenceDate,
        claimSupported: "A small VQE example demonstrates an iterative classical-quantum loop.",
        resultType: "Tutorial",
        notes: "Toy simulation; no production or hardware-performance claim.",
      },
    ],
    relatedAssessmentDefaults: {
      source: "series-02",
      problemClass: "QUANTUM_SIMULATION",
      goal: "research",
    },
    nextArticleSlug: null,
  },
];

export function getSeriesArticle(slug: string): SeriesArticle | null {
  return SERIES_ARTICLES.find((article) => article.slug === slug) ?? null;
}

export function getSeriesCompanion(slug: string): ArticleCompanion | null {
  return SERIES_COMPANIONS.find((companion) => companion.articleSlug === slug) ?? null;
}
