export type LessonPath =
  | "beginner"
  | "cirq"
  | "algorithms"
  | "qsim"
  | "openfermion"
  | "google-cloud"
  | "pqc";

export type LessonLevel = "beginner" | "intermediate" | "advanced";

export type Lesson = {
  slug: string;
  path: LessonPath;
  title: string;
  subtitle: string;
  level: LessonLevel;
  estimatedMinutes: number;
  learningObjectives: string[];
  explanationMarkdown: string;
  cirqCode?: string;
  buildTemplateKey?: "coin_flip" | "bell_state" | "grover" | "routing" | "chemistry";
  quiz: {
    question: string;
    options: string[];
    correctOptionIndex: number;
    explanation: string;
  }[];
  googleSourceLinks: {
    label: string;
    url: string;
  }[];
  nextLessonSlug?: string;
};

export type LessonPathMeta = {
  path: LessonPath;
  title: string;
  subtitle: string;
  level: LessonLevel;
  description: string;
};

const CIRq_LINKS = [
  {
    label: "Cirq documentation",
    url: "https://quantumai.google/cirq",
  },
];

const CLOUD_LINKS = [
  {
    label: "Cloud Run documentation",
    url: "https://cloud.google.com/run/docs",
  },
];

function lesson(
  path: LessonPath,
  slug: string,
  title: string,
  subtitle: string,
  options?: Partial<Lesson>,
): Lesson {
  return {
    slug,
    path,
    title,
    subtitle,
    level: options?.level ?? "beginner",
    estimatedMinutes: options?.estimatedMinutes ?? 7,
    learningObjectives: options?.learningObjectives ?? [
      "Explain the concept in plain language.",
      "Connect the idea to a small Cirq example.",
      "Know what can be simulated locally today.",
    ],
    explanationMarkdown:
      options?.explanationMarkdown ??
      `${title} is part of the Quantum Foundry learning path. The goal is to build intuition first, then connect the concept to Cirq-based simulation and Google Cloud architecture patterns.`,
    cirqCode: options?.cirqCode,
    buildTemplateKey: options?.buildTemplateKey,
    quiz:
      options?.quiz ??
      [
        {
          question: `What is the main takeaway from ${title}?`,
          options: [
            "Use the concept to reason about a small simulated circuit.",
            "Assume it proves quantum advantage.",
            "Skip classical baselines.",
          ],
          correctOptionIndex: 0,
          explanation:
            "Quantum Foundry keeps the lesson simulation-first and compares ideas against classical baselines before recommending a pilot.",
        },
      ],
    googleSourceLinks: options?.googleSourceLinks ?? CIRq_LINKS,
    nextLessonSlug: options?.nextLessonSlug,
  };
}

export const LESSON_PATHS: LessonPathMeta[] = [
  {
    path: "beginner",
    title: "Beginner Quantum Concepts",
    subtitle: "Build intuition before equations.",
    level: "beginner",
    description: "Bits, qubits, measurement, interference, and why small demos help teams reason clearly.",
  },
  {
    path: "cirq",
    title: "Cirq Fundamentals",
    subtitle: "Learn the Cirq-based circuit model.",
    level: "beginner",
    description: "Line qubits, gates, moments, measurement histograms, and the Cirq simulator.",
  },
  {
    path: "algorithms",
    title: "Quantum Algorithms in Cirq",
    subtitle: "Use toy circuits to understand algorithm patterns.",
    level: "intermediate",
    description: "Bell states, teleportation intuition, Deutsch-Jozsa, Grover search, and QAOA intuition.",
  },
  {
    path: "qsim",
    title: "qsim Simulation",
    subtitle: "Understand optional high-performance simulation.",
    level: "intermediate",
    description: "Why simulation gets hard, where qsim fits, and how to place it on Google Cloud.",
  },
  {
    path: "openfermion",
    title: "OpenFermion Chemistry",
    subtitle: "Learn chemistry vocabulary without overclaiming.",
    level: "intermediate",
    description: "Molecular Hamiltonians, fermionic operators, and why materials use cases are long-horizon.",
  },
  {
    path: "google-cloud",
    title: "Google Cloud Architecture",
    subtitle: "Map hybrid workflows to Cloud Run, jobs, storage, and data.",
    level: "intermediate",
    description: "Simulation-first architecture patterns for prototypes, exports, and controlled pilots.",
  },
  {
    path: "pqc",
    title: "Post-Quantum Cryptography Readiness",
    subtitle: "Prepare classical systems for quantum-era cryptography.",
    level: "beginner",
    description: "Cryptographic inventory, migration readiness, and standards-aware planning.",
  },
];

export const LESSONS: Lesson[] = [
  lesson("beginner", "what-is-a-qubit", "What is a qubit?", "A visual mental model for quantum state.", {
    buildTemplateKey: "coin_flip",
    cirqCode: "import cirq\n\nq = cirq.LineQubit(0)\ncircuit = cirq.Circuit(cirq.H(q), cirq.measure(q, key='m'))\nprint(circuit)",
    explanationMarkdown:
      "A qubit is the smallest unit of quantum information. In Cirq, you can start with a single qubit, apply a Hadamard gate, and measure it many times to see a histogram. The histogram is classical data produced by a quantum-inspired simulation, not evidence of business advantage.",
    nextLessonSlug: "superposition",
  }),
  lesson("beginner", "superposition", "Superposition", "Why one qubit can behave unlike one bit.", {
    buildTemplateKey: "coin_flip",
    nextLessonSlug: "measurement",
  }),
  lesson("beginner", "measurement", "Measurement", "How amplitudes become classical outcomes.", {
    buildTemplateKey: "coin_flip",
    nextLessonSlug: "entanglement",
  }),
  lesson("beginner", "entanglement", "Entanglement", "Correlations that cannot be explained as two independent coins.", {
    buildTemplateKey: "bell_state",
    cirqCode:
      "import cirq\n\nq0, q1 = cirq.LineQubit.range(2)\ncircuit = cirq.Circuit(cirq.H(q0), cirq.CNOT(q0, q1), cirq.measure(q0, q1, key='m'))\nprint(circuit)",
    nextLessonSlug: "interference",
  }),
  lesson("beginner", "interference", "Interference", "How amplitudes can reinforce or cancel.", {
    buildTemplateKey: "grover",
    nextLessonSlug: "amplitude-amplification",
  }),
  lesson("beginner", "amplitude-amplification", "Amplitude amplification", "The intuition behind Grover-style search.", {
    buildTemplateKey: "grover",
  }),

  lesson("cirq", "line-qubits-and-grid-qubits", "Line qubits and grid qubits", "Choose qubit layouts in Cirq.", {
    level: "beginner",
    nextLessonSlug: "gates-and-operations",
  }),
  lesson("cirq", "gates-and-operations", "Gates and operations", "Turn gate ideas into concrete operations.", {
    level: "beginner",
    buildTemplateKey: "bell_state",
    nextLessonSlug: "circuits-and-moments",
  }),
  lesson("cirq", "circuits-and-moments", "Circuits and moments", "Understand circuit timing and grouping.", {
    level: "beginner",
    nextLessonSlug: "measurement-histograms",
  }),
  lesson("cirq", "measurement-histograms", "Measurement histograms", "Read simulator results without overinterpreting them.", {
    level: "beginner",
    buildTemplateKey: "coin_flip",
    nextLessonSlug: "cirq-simulator",
  }),
  lesson("cirq", "cirq-simulator", "Cirq simulator", "Run classical simulation of Cirq circuits.", {
    level: "beginner",
    buildTemplateKey: "coin_flip",
  }),

  lesson("algorithms", "bell-state", "Bell state", "A compact entanglement demo.", {
    level: "intermediate",
    buildTemplateKey: "bell_state",
    nextLessonSlug: "teleportation-intuition",
  }),
  lesson("algorithms", "teleportation-intuition", "Teleportation intuition", "Separate information transfer from science fiction.", {
    level: "intermediate",
    nextLessonSlug: "deutsch-jozsa",
  }),
  lesson("algorithms", "deutsch-jozsa", "Deutsch-Jozsa", "A small oracle example for algorithmic contrast.", {
    level: "intermediate",
    nextLessonSlug: "grover-search",
  }),
  lesson("algorithms", "grover-search", "Grover search", "Search amplification with a toy target state.", {
    level: "intermediate",
    buildTemplateKey: "grover",
    nextLessonSlug: "qaoa-intuition",
  }),
  lesson("algorithms", "qaoa-intuition", "QAOA intuition", "Optimization as alternating cost and mixer layers.", {
    level: "intermediate",
    buildTemplateKey: "routing",
  }),

  lesson("qsim", "why-simulation-gets-hard", "Why simulation gets hard", "State vectors grow exponentially.", {
    level: "intermediate",
    googleSourceLinks: [{ label: "qsim documentation", url: "https://quantumai.google/qsim" }],
    nextLessonSlug: "qsim-overview",
  }),
  lesson("qsim", "qsim-overview", "qsim overview", "Where optional qsim acceleration fits.", {
    level: "intermediate",
    googleSourceLinks: [{ label: "qsim documentation", url: "https://quantumai.google/qsim" }],
    nextLessonSlug: "qsim-on-google-cloud",
  }),
  lesson("qsim", "qsim-on-google-cloud", "qsim on Google Cloud", "Run larger simulator jobs as cloud workloads.", {
    level: "intermediate",
    googleSourceLinks: CLOUD_LINKS,
  }),

  lesson("openfermion", "why-chemistry-is-hard", "Why chemistry is hard", "Electron interactions create rich state spaces.", {
    level: "intermediate",
    buildTemplateKey: "chemistry",
    googleSourceLinks: [{ label: "OpenFermion", url: "https://quantumai.google/openfermion" }],
    nextLessonSlug: "fermionic-operators",
  }),
  lesson("openfermion", "fermionic-operators", "Fermionic operators", "A vocabulary bridge into molecular simulation.", {
    level: "intermediate",
    googleSourceLinks: [{ label: "OpenFermion", url: "https://quantumai.google/openfermion" }],
    nextLessonSlug: "hamiltonians",
  }),
  lesson("openfermion", "hamiltonians", "Hamiltonians", "Represent energy as the object a simulation studies.", {
    level: "intermediate",
    nextLessonSlug: "small-molecule-story",
  }),
  lesson("openfermion", "small-molecule-story", "Small molecule story", "Keep v1 chemistry educational and scoped.", {
    level: "intermediate",
    buildTemplateKey: "chemistry",
  }),

  lesson("google-cloud", "simulation-first-architecture", "Simulation-first architecture", "The safest default for enterprise exploration.", {
    level: "intermediate",
    googleSourceLinks: CLOUD_LINKS,
    nextLessonSlug: "cloud-run-backend",
  }),
  lesson("google-cloud", "cloud-run-backend", "Cloud Run backend", "Host the API as a containerized service.", {
    level: "intermediate",
    googleSourceLinks: CLOUD_LINKS,
    nextLessonSlug: "cloud-run-jobs",
  }),
  lesson("google-cloud", "cloud-run-jobs", "Cloud Run Jobs", "Move long simulations and exports out of the request path.", {
    level: "intermediate",
    googleSourceLinks: [{ label: "Cloud Run jobs", url: "https://cloud.google.com/run/docs/create-jobs" }],
    nextLessonSlug: "cloud-storage-artifacts",
  }),
  lesson("google-cloud", "cloud-storage-artifacts", "Cloud Storage artifacts", "Persist notebooks, summaries, and JSON exports.", {
    level: "intermediate",
    googleSourceLinks: [{ label: "Cloud Storage", url: "https://cloud.google.com/storage/docs" }],
    nextLessonSlug: "bigquery-analytics",
  }),
  lesson("google-cloud", "bigquery-analytics", "BigQuery analytics", "Analyze pilot inputs and outputs with classical data tools.", {
    level: "intermediate",
    googleSourceLinks: [{ label: "BigQuery", url: "https://cloud.google.com/bigquery/docs" }],
  }),

  lesson("pqc", "why-quantum-affects-cryptography", "Why quantum affects cryptography", "Separate quantum computing from post-quantum migration.", {
    nextLessonSlug: "pqc-migration-readiness",
  }),
  lesson("pqc", "pqc-migration-readiness", "PQC migration readiness", "Plan inventory and migration without panic.", {
    nextLessonSlug: "crypto-inventory-checklist",
  }),
  lesson("pqc", "crypto-inventory-checklist", "Crypto inventory checklist", "Find systems, keys, protocols, and owners.", {
  }),
];

export const LESSON_BY_SLUG = new Map(LESSONS.map((item) => [item.slug, item]));

export function isLessonPath(value: string): value is LessonPath {
  return LESSON_PATHS.some((item) => item.path === value);
}

export function getLessonsByPath(path: LessonPath): Lesson[] {
  return LESSONS.filter((lessonItem) => lessonItem.path === path);
}

export function getLesson(path: LessonPath, slug: string): Lesson | undefined {
  return LESSONS.find((lessonItem) => lessonItem.path === path && lessonItem.slug === slug);
}

export function getNextLesson(current: Lesson): Lesson | undefined {
  return current.nextLessonSlug ? LESSON_BY_SLUG.get(current.nextLessonSlug) : undefined;
}
