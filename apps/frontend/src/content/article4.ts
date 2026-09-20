import suppliedSources from "./article4-sources.json";

export const ARTICLE4_REVISION = "article4-v9";
export const ARTICLE4_TITLE = "There Is No Single Winning Qubit Technology";
export const ARTICLE4_ASSET_ROOT = "/articles/04-qubit-technologies/v9";
export const ARTICLE4_LESSON_IDS = [
  "sampling", "scheduling", "transmon", "ions", "routing", "blockade", "photonics", "loss", "phase", "entanglement",
] as const;
export type Article4LessonId = (typeof ARTICLE4_LESSON_IDS)[number];

export interface Article4Source {
  id: string;
  number: number;
  text: string;
  links: Array<{ text: string; url: string }>;
}

export interface Article4Lesson {
  id: Article4LessonId;
  title: string;
  question: string;
  paragraphs: string[];
  takeaway: string;
  shows: string;
  doesNotShow: string;
  technical: { paragraphs: string[]; equations: string[] };
  sourceIds: string[];
  nextLessonId: Article4LessonId;
  tool?: "sampling" | "scheduling" | "routing" | "optics";
  media: {
    still: string;
    alt: string;
    caption: string;
    mp4?: string;
    gif?: string;
    print?: string;
    steps: Array<{ text: string; image?: string }>;
  };
}

// Original [n] identifiers, citation text, and hyperlinks retained from the V9 DOCX.
// Importing a source is not a new scientific review; no review date is fabricated.
export const ARTICLE4_SOURCES: Article4Source[] = suppliedSources;
export const ARTICLE4_SOURCE_NOTE = "References retain the V9 article’s original numbered trail. The supplied document describes targeted primary-source checks, not independent peer review or an exhaustive market update. Separate V9 review notes were not supplied; no new scientific review date is assigned here.";

function media(id: Article4LessonId, alt: string, caption: string, steps: string[]): Article4Lesson["media"] {
  return {
    still: `${ARTICLE4_ASSET_ROOT}/${id}.png`,
    alt,
    caption,
    // Only the original embedded stills are available. Do not invent paths to
    // absent MP4, GIF, numbered-step, or print assets.
    steps: steps.map((text) => ({ text })),
  };
}

export const ARTICLE4_LESSONS: Article4Lesson[] = [
  {
    id: "sampling",
    title: "Sampling versus bias",
    question: "Will more measurements remove a persistent offset?",
    paragraphs: [
      "A chemistry team wants to decide which catalyst to test next. An electronic-energy calculation can answer a precise question about a chosen molecular model, but it does not replace a laboratory experiment or account for every operating condition.",
      "Repeated independent measurements can narrow statistical uncertainty. A persistent offset, also called bias, is different: it shifts the average estimate away from the reference. Explore a deliberately simple model in normalized teaching units to see why collecting more data does not necessarily collect better data.",
    ],
    takeaway: "More samples can make an estimate more precise while leaving its expected value displaced from the reference.",
    shows: "How the spread of a sample mean shrinks while an assumed fixed offset remains. The reference and offset are chosen for this lesson.",
    doesNotShow: "A measured molecular energy, a catalyst calculation, a VQE optimizer, an SQD eigensolver, or a QPE implementation. Gate infidelity is not an energy-bias input.",
    technical: {
      paragraphs: [
        "The standard-error formula assumes independent samples with a finite single-sample variance. The mean squared error separates squared bias from sampling variance. A one-standard-error band is neither a guaranteed accuracy interval nor automatically a 95% confidence interval.",
        "VQE estimates expectations and uses a classical optimizer to change circuit parameters. SQD uses quantum samples to identify a subspace for a classical eigenvalue calculation. QPE extracts eigenvalue information through controlled evolution. Their state preparation, circuit quality, optimization, and classical costs remain distinct.",
        "Real chemistry adds model error, circuit approximation, noise-dependent bias, and optimizer effects. Noise can change both mean and variance; not every observable has nonzero bias under every noise channel.",
      ],
      equations: ["expected estimate = reference + b", "standard error = √(variance / N)", "mean squared error = b² + variance / N", "VQE: E(θ) = ⟨ψ(θ)|H|ψ(θ)⟩ = Σⱼ hⱼ⟨Pⱼ⟩", "SQD: Hₛ = Pₛ H Pₛ restricted to S; Hₛc = Eₛc", "QPE: exp(−iHt/ℏ)|E⟩ = exp(−iEt/ℏ)|E⟩"],
    },
    sourceIds: ["[1]", "[2]", "[36]", "[37]", "[41]"],
    nextLessonId: "transmon",
    tool: "sampling",
    media: media("sampling", "Reference-centered and offset schematic sampling distributions; increasing sample size narrows the spread without removing the offset.", "Figure 1. The reference and offset are chosen for this lesson. The curves show schematic sample-mean spreads with heights normalized for display, not energies measured on quantum hardware.", [
      "Choose a reference and a fixed offset. The expected estimate is the reference plus that offset.",
      "With 100 independent samples and single-sample variance 1, the standard error is 0.1 teaching units.",
      "With 10,000 samples, the standard error is 0.01. The expected estimate has not moved.",
      "Compare uncertainty and offset separately. More sampling addresses the first under this model, not the second.",
    ]),
  },
  {
    id: "scheduling",
    title: "Five jobs, shared equipment",
    question: "Which jobs can share one time slot without using the same equipment?",
    paragraphs: [
      "Five jobs, A through E, each need two pieces of equipment. A and B both need the press, so they cannot run together. A and C need different equipment and can share a slot.",
      "Draw a dot for each job and a line for each equipment conflict. A valid selection contains no linked pair. The largest such selection is a maximum independent set: for this five-job ring its size is two. Checking every choice is a small classical calculation.",
    ],
    takeaway: "A valid selection avoids every equipment conflict. A maximum selection is a valid selection with the largest possible number of jobs.",
    shows: "The exact five-job equipment model, its derived conflict graph, and an exhaustive classical check of all 32 subsets.",
    doesNotShow: "A general factory scheduler, job durations, priorities, setup times, a quantum benchmark, or an execution of this graph on atoms.",
    technical: {
      paragraphs: [
        "Let xᵢ be 1 for a selected job and 0 otherwise. A penalty of 2 makes every conflicting global minimum unfavorable: removing a selected job with r selected neighbors changes cost by 1 − 2r, which is negative whenever r ≥ 1. Among conflict-free choices, the objective rewards the largest set.",
        "This proves the encoding, not that a quantum procedure finds its global minimum efficiently. A physical mapping needs suitable geometry, controls, and a comparison with a strong classical solver; real interactions can extend beyond the desired edges.",
      ],
      equations: ["cost(x) = −Σᵢ xᵢ + 2 Σ₍ᵢ,ⱼ₎∈edges xᵢxⱼ", "conflicts: AB, BC, CD, DE, EA", "maximum selections: AC, AD, BD, BE, CE"],
    },
    sourceIds: ["[3]", "[13]", "[34]"],
    nextLessonId: "blockade",
    tool: "scheduling",
    media: media("scheduling", "Five equipment requirements become a ring of job conflicts and a checked two-job selection.", "Figure 2. The same jobs remain visible as equipment requirements become conflicts and then a checked selection. This five-job example is solved classically; it is not a quantum benchmark.", [
      "List each job’s equipment: A uses press and inspection; B press and drill; C drill and mill; D mill and oven; E oven and inspection.",
      "Connect jobs sharing equipment. The five edges form a ring: AB, BC, CD, DE, EA.",
      "Check a proposed selection against those edges. A and B conflict at the press; A and C do not conflict.",
      "Enumerate all 32 subsets classically. Eleven are valid, including the empty set; five have the maximum size of two.",
    ]),
  },
  {
    id: "transmon",
    title: "A circuit stores a qubit",
    question: "What changes when a microwave pulse reaches a transmon?",
    paragraphs: [
      "A transmon is a small electrical circuit operated at very low temperature. A capacitor and a Josephson junction give it unequal energy-level spacings. The lowest two levels store the qubit: the information belongs to a collective circuit state, not an individual electron moving through a wire.",
      "Microwave pulses change that state while the chip stays in place. A resonator and measurement electronics read out a response that depends on the qubit state. Short operations help a repeated experiment only when the complete preparation, circuit, readout, and reset meet its accuracy target.",
    ],
    takeaway: "The pulse changes the circuit’s quantum state. Fast operations alone do not determine how quickly the complete experiment gives a useful answer.",
    shows: "An ideal qubit rotation, with explanatory pulse and readout sketches.",
    doesNotShow: "A calibrated transmon, actual leakage, device-specific pulse optimization, measured readout performance, or a hardware speed comparison.",
    technical: {
      paragraphs: [
        "E_C and E_J are charging and Josephson energies. n and φ are the Cooper-pair number and phase operators; n_g is an offset charge. A large E_J/E_C suppresses charge sensitivity while preserving finite anharmonicity, so neighboring transition frequencies remain unequal but not widely separated.",
        "Illustrative E_J/h = 20 GHz and E_C/h = 0.2 GHz give f₀₁ ≈ 5.46 GHz, f₁₂ ≈ 5.26 GHz, and α_f ≈ −0.20 GHz. Level 2 is outside the intended qubit space. Inverse pulse duration is a bandwidth scale, not a universal five-nanosecond speed limit.",
        "DRAG means derivative removal by adiabatic gate. It adds a derivative-shaped control quadrature, generally with phase or detuning corrections. Signs and coefficients depend on the convention and device model; the technique does not guarantee a specific leakage rate or gate duration.",
      ],
      equations: ["H = 4E_C(n − n_g)² − E_J cos(φ)", "f₀₁ ≈ [√(8E_J E_C) − E_C] / h", "α_f = f₁₂ − f₀₁ ≈ −E_C/h", "Ω_Q(t) ∝ −[dΩ_I(t)/dt] / Δ; Δ is angular-frequency anharmonicity"],
    },
    sourceIds: ["[6]", "[7]", "[29]", "[33]"],
    nextLessonId: "ions",
    media: media("transmon", "An ideal qubit-state rotation beside schematic microwave pulse and resonator-readout drawings; the chip sites stay fixed.", "Figure 3. One ideal rotation changes a qubit’s measurement probabilities. The pulse and readout sketches are explanatory; they do not model a calibrated transmon or its leakage.", [
      "Cool and reset the device. A cold refrigerator alone does not guarantee perfect state preparation.",
      "Apply a microwave control pulse. It changes the qubit state rather than moving the chip.",
      "Use designed couplings for selected two-qubit interactions. Additional routing may be needed for other pairs.",
      "Probe a readout resonator and record the response. Evaluate the entire preparation-to-readout experiment.",
    ]),
  },
  {
    id: "ions",
    title: "Shared motion, internal states",
    question: "How can an ion’s motion help two qubits interact?",
    paragraphs: [
      "An ion is a charged atom held by electromagnetic fields in a vacuum. Two selected internal atomic states store its qubit. Laser or microwave controls manipulate those states; coupled vibrations provide a way for different ions to interact.",
      "A controlled sequence uses shared motion to mediate a two-qubit operation, then aims to remove unwanted residual coupling to that motion. Flexible pair access can avoid some routing gates, but transport, cooling, measurement, and shared operation zones still cost time.",
    ],
    takeaway: "Shared motion can mediate an interaction between internal qubits. Flexible pair access does not make every pair simultaneous or free.",
    shows: "Exaggerated schematic motion and the outcome probabilities of an ideal XX interaction.",
    doesNotShow: "Measured ion motion, a calibrated gate, unrestricted simultaneous all-to-all operations, or an entanglement test based only on matching 00/11 outcomes.",
    technical: {
      paragraphs: [
        "The illustrated XX interaction at θ = π/2 prepares (|00⟩ − i|11⟩)/√2. That relative phase matters: its ZZ correlation is +1, XX is 0, and XY and YX are −1 in the standard Pauli convention.",
        "The plus-Bell state’s XX illustration is not the right direct test for this ion state. A suitable local phase rotation can convert it into the plus-Bell state, or the measurement axes can be changed.",
        "QCCD processors physically transport ions between zones. The full transport and gate schedule, cooling requirements, permitted parallelism, and readout belong in a comparison of complete experiments.",
      ],
      equations: ["U_XX(θ) = exp(−iθ X₁X₂/2)", "U_XX(θ)|00⟩ = cos(θ/2)|00⟩ − i sin(θ/2)|11⟩", "at θ = π/2: ⟨ZZ⟩ = 1; ⟨XX⟩ = 0; ⟨XY⟩ = ⟨YX⟩ = −1"],
    },
    sourceIds: ["[9]", "[10]", "[11]", "[12]"],
    nextLessonId: "routing",
    media: media("ions", "Two internal ion qubits interact through exaggerated shared motion; the ideal endpoint has equally likely 00 and 11 outcomes.", "Figure 4. The motion is exaggerated and schematic. The final probabilities correspond to an ideal XX gate. Shared 00/11 outcomes alone are not an entanglement test; Companion B supplies the missing comparison.", [
      "Trap and cool the ions, then initialize their internal qubit states.",
      "Use their coupled vibrations to mediate a controlled interaction.",
      "Finish the pulse sequence so the intended joint qubit state is disentangled from residual motion.",
      "Read the internal states using state-dependent fluorescence. Matching bits alone do not establish entanglement.",
    ]),
  },
  {
    id: "routing",
    title: "The cost of reaching a partner",
    question: "Why can one requested interaction require extra work?",
    paragraphs: [
      "Suppose three fixed hardware sites contain states A, X, and B. A and B need to interact. Swapping the states A and X produces X, A, B, bringing the required pair together. The state labels move; the chip sites do not.",
      "A common CNOT-based accounting assigns three two-qubit gates to each SWAP, followed by one requested gate. Explore invented gate times to see where the extra work changes the comparison. Physical transport in an ion processor is a different mechanism, with its own schedule and costs.",
    ],
    takeaway: "Extra state exchanges can outweigh a faster local gate. The answer depends on the full implementation and the comparison being made.",
    shows: "One stated CNOT-based routing strategy without restoring the original placement, using arbitrary time units.",
    doesNotShow: "A compiler lower bound, a vendor benchmark, application success, or energy bias. Transport, parallelism, readout, reset, and errors are omitted.",
    technical: {
      paragraphs: [
        "For k SWAPs along a simple path, each decomposed into three CNOTs, the count is 3k + 1. Native gates, gate fusion, initial placement, dynamic remapping, and restoration requirements can change that count.",
        "Summing average gate infidelities does not generally give energy bias. A no-fault probability such as (1 − p)^G requires an independent stochastic fault model, and average gate infidelity is not automatically its p. Observable sensitivity, coherent errors, correlations, and leakage matter.",
        "A QCCD system instead pays for physical transport, cooling, and scheduled zones. The article’s step timelines are not matched physical durations.",
      ],
      equations: ["gate count = 3k + 1", "local gate-only duration = (3k + 1) × local operation time", "direct gate-only duration = illustrative direct operation time"],
    },
    sourceIds: ["[7]", "[11]", "[12]"],
    nextLessonId: "blockade",
    tool: "routing",
    media: media("routing", "A fixed-site SWAP moves state labels from A,X,B to X,A,B; a separate lane illustrates physical ion transport.", "Figure 5. On top, quantum states exchange places between fixed sites. Below, ions move to an operation zone. The timelines are steps, not matched physical durations or vendor benchmarks.", [
      "Start with fixed sites holding A, X, and B. The requested interaction is between A and B.",
      "Exchange the states A and X. The hardware sites remain in their original positions.",
      "The arrangement is now X, A, B. Apply the requested operation to the adjacent A and B states.",
      "Count three CNOTs per SWAP plus the requested gate. Separately account for physical transport when comparing an ion implementation.",
    ]),
  },
  {
    id: "blockade",
    title: "A neighbor shifts the transition",
    question: "Why does the same pulse excite one atom but barely affect another?",
    paragraphs: [
      "Optical tweezers are tightly focused light traps for neutral atoms. A laser can temporarily excite an atom into a Rydberg state, whose electron probability distribution extends much farther. The electron has not escaped.",
      "Two nearby Rydberg excitations interact strongly. An excited neighbor shifts the energy needed to excite the target, so a pulse that worked without the neighbor is now off resonance. This suppression is Rydberg blockade: a physical mechanism that can support gates or suitably mapped conflict graphs.",
    ],
    takeaway: "A changed transition energy can suppress the response to the same pulse. Blockade is suppression, not an absolute prohibition or a complete algorithm.",
    shows: "A conditional, ideal two-level target model with an assumed interaction shift eight times the drive scale.",
    doesNotShow: "A complete two-atom CZ gate, analog MIS dynamics, an atom optimizer, or a hardware run of the five-job schedule.",
    technical: {
      paragraphs: [
        "In the illustrative animation the neighbor is fixed and creates detuning Δ = 8Ω. The maximum target excitation is then 1/65, not exactly zero. This is a didactic conditional model rather than a full gate-pulse simulation.",
        "A common blockade radius equates interaction and drive energy scales. Strong blockade requires a much larger ratio; crossing that nominal radius is not a hard boundary. The stated van der Waals interaction decreases by a factor of 64 when distance doubles.",
        "Analog conflict-graph experiments encode selection in ground/Rydberg occupation. Representative digital designs store qubits in stable internal states and use Rydberg excitation temporarily during a gate. Real interactions have tails, and broader graph mappings may require auxiliary atoms.",
      ],
      equations: ["Pᵣ(t) = [Ω²/(Ω² + Δ²)] sin²(√(Ω² + Δ²)t/2)", "Δ = 8Ω ⇒ maximum excitation = 1/65", "V(R) = C₆/R⁶; R_b = (|C₆|/(ℏΩ))^(1/6)"],
    },
    sourceIds: ["[3]", "[13]", "[14]", "[15]", "[34]"],
    nextLessonId: "photonics",
    media: media("blockade", "The same target pulse is compared without and with an excited neighbor; the shifted transition has a small residual excitation.", "Figure 6. The two panels use the same target pulse. The right-hand energy shift is an assumed eight times the drive scale. Its small residual excitation is allowed by the model; blockade does not mean a mathematically forbidden event.", [
      "Tune a target pulse to its transition while the neighboring atom is unexcited.",
      "Excite the neighbor into a Rydberg state. The interaction changes the target’s transition energy.",
      "Apply the same target pulse. It is now off resonance and excitation is suppressed.",
      "Retain the small residual excitation allowed by this model. A suppressed response is not a forbidden event.",
    ]),
  },
  {
    id: "photonics",
    title: "One photon, two path amplitudes",
    question: "How does phase change which detector is likely to click?",
    paragraphs: [
      "One photon in two possible optical paths can represent a single qubit, called a path-encoded or dual-rail qubit. A beam splitter mixes the two path amplitudes—the contributions to the state—without creating a second copy of the photon.",
      "A phase shifter changes how those contributions combine when the paths meet again. Interference then changes the probabilities at two detectors. Each setting describes fresh preparations of the ideal one-photon state; repeated detections would estimate those probabilities.",
    ],
    takeaway: "Changing relative phase changes the ideal detector probabilities when the paths recombine. The two paths carry amplitudes of one photon.",
    shows: "One balanced, lossless interferometer and its ideal probabilities under the article’s phase convention.",
    doesNotShow: "Two photon copies, observed detector counts, a universal photonic processor, or a logical-operation rate determined by the speed of light.",
    technical: {
      paragraphs: [
        "With the article’s convention, φ = 0 directs probability to D0, π/2 splits it equally, and π directs it to D1. Another phase convention can exchange the output labels. Every setting assumes a fresh state preparation.",
        "A larger photonic computer needs additional resources and measurement-induced operations. Fusion-based designs connect prepared entangled resources through joint measurements. Optical GKP encodings use structured grids in an oscillator’s phase space, not one photon in two literal paths.",
        "Approximate state preparation, detection, loss, feed-forward, and error correction remain part of the resource budget. An optical link can also connect matter-qubit processors; networking is not exclusive to all-photonic machines.",
      ],
      equations: ["P(D0) = cos²(φ/2)", "P(D1) = sin²(φ/2)", "P(D0) + P(D1) = 1"],
    },
    sourceIds: ["[16]", "[17]", "[18]", "[19]", "[20]", "[21]"],
    nextLessonId: "loss",
    tool: "optics",
    media: media("photonics", "One photon’s two path amplitudes pass a phase shifter and recombine, producing phase-dependent probabilities at detectors D0 and D1.", "Figure 7. Each phase setting describes fresh preparations of the ideal one-photon state. The traces are amplitudes, not two photons. The diagram explains a single-qubit interferometer, not a universal quantum computer.", [
      "Prepare one photon and mix its two optical modes at a beam splitter.",
      "Change the relative phase between the two path amplitudes.",
      "Recombine the paths. Interference sets the ideal probabilities at D0 and D1.",
      "Detect a fresh preparation. In an ideal successful trial one detector clicks; repeat to estimate probabilities.",
    ]),
  },
  {
    id: "loss",
    title: "How much arrives?",
    question: "How many expected detections remain after four lossy stages?",
    paragraphs: [
      "The quality of an accepted event and how often it arrives answer different questions. A sequence of conditional efficiencies describes delivery: each stage acts on the photons that reached it.",
      "With 100 launches and four hypothetical 90% stages, the expected counts are 100, 90, 81, 72.9, and 65.61. Fractional values are expectations over repeated trials, not individual observed photon counts. This calculation stays separate from the ideal phase probabilities.",
    ],
    takeaway: "Good quality in detected events does not guarantee a high delivery rate. Losses compound along the assumed path.",
    shows: "Expected delivery through four stages whose efficiencies are conditional on reaching each stage.",
    doesNotShow: "Conditional state fidelity, full-algorithm success, a universal fault-tolerance threshold, or a count of photons actually observed.",
    technical: {
      paragraphs: [
        "Multiplying conditional stage efficiencies gives the path efficiency. Multiplying that by launches gives an expected detection count. For a stationary attempt process, accepted-event rate is attempt rate times acceptance probability, but that remains distinct from application correctness.",
        "Heralding identifies usable events or particular failures under a stated detection model. Missing clicks in multiphoton measurements can flag erased information without identifying exactly where the loss occurred. Dark counts and other faults complicate interpretation.",
        "Published fault-tolerance thresholds belong to specific resource and error models. Bartolucci’s stated fusion scheme links 10.4% fusion loss to 2.7% independent loss per photon; those definitions cannot be applied as a universal threshold for this four-stage path.",
      ],
      equations: ["η_path = η₁η₂η₃η₄", "expected detections = launches × η_path", "0.9⁴ = 0.6561; 100 × 0.6561 = 65.61", "specified four-photon model: 1 − (1 − 0.027)⁴ ≈ 0.1037"],
    },
    sourceIds: ["[17]", "[18]"],
    nextLessonId: "phase",
    tool: "optics",
    media: media("loss", "A four-stage optical path retains expected counts 90, 81, 72.9, and 65.61 from 100 launches when every conditional efficiency is 90%.", "Figure 8. Four hypothetical stages each transmit or detect 90% of incoming photons. The expected surviving fraction is 65.61%. This is neither state fidelity nor the success probability of a full photonic algorithm.", [
      "Begin with 100 launches and specify efficiencies conditional on reaching each stage.",
      "A 90% first stage leaves 90 expected arrivals; a second 90% stage leaves 81.",
      "The next stages leave 72.9 and 65.61 expected detections. Fractional values describe expectations.",
      "Report delivery separately from the quality of the accepted events. Neither is a universal application-success score.",
    ]),
  },
  {
    id: "phase",
    title: "A phase becomes visible",
    question: "Can states with the same immediate probabilities behave differently?",
    paragraphs: [
      "Yes. Relative phase describes how contributions to a quantum state combine. On the equator of a Bloch sphere—a coordinate picture for a single qubit—every angle gives equal immediate 0/1 probabilities in the Z measurement basis.",
      "An analysis operation called a Hadamard gate combines the amplitudes before measurement. Its output probabilities depend on phase, revealing a difference that the first measurement setting could not show. The arrow is a state coordinate, not an electron orbit.",
    ],
    takeaway: "Phase is not another probability. It changes what a later operation and measurement can reveal.",
    shows: "An ideal single-qubit model comparing direct Z measurement with an analysis gate followed by measurement, using fresh preparations.",
    doesNotShow: "Measuring and recovering the same unknown qubit, an electron trajectory, or the complete state of an entangled pair represented by two arrows.",
    technical: {
      paragraphs: [
        "For the displayed pure state, θ determines the direct Z probabilities while φ is the relative phase. At θ = π/2 the direct probabilities are one half for every φ. Applying H before measurement makes the relative phase affect the output.",
        "Pure single-qubit states lie on the Bloch-sphere surface; mixed states lie inside. This picture does not describe the full correlations of an entangled two-qubit state using two independent surface arrows.",
      ],
      equations: ["|ψ⟩ = cos(θ/2)|0⟩ + exp(iφ)sin(θ/2)|1⟩", "P(0) = cos²(θ/2); P(1) = sin²(θ/2)", "at θ = π/2: P(0 after H) = (1 + cos φ)/2", "at θ = π/2: P(1 after H) = (1 − cos φ)/2"],
    },
    sourceIds: ["[4]", "[5]"],
    nextLessonId: "entanglement",
    media: media("phase", "A Bloch-sphere equator shows unchanged direct Z probabilities while an analysis operation reveals phase-dependent outcomes.", "Figure 9. Moving around the equator leaves direct Z-basis probabilities unchanged. An analysis operation makes the phase visible. The arrow is a state coordinate, not an electron orbit.", [
      "Prepare an equatorial pure state. Direct Z measurements give equal probabilities for 0 and 1.",
      "Change the relative phase around the equator. Those immediate Z probabilities stay unchanged.",
      "Apply a Hadamard analysis gate to a fresh preparation. It combines amplitudes before measurement.",
      "Compare the new output probabilities. The phase now affects the observable result.",
    ]),
  },
  {
    id: "entanglement",
    title: "Matching bits are not enough",
    question: "Do matching outcomes prove that two qubits are entangled?",
    paragraphs: [
      "Two very different models can give the same matching bits. The plus-Bell state and an ordinary mixture of 00 and 11 both return 00 or 11 equally often when both qubits are measured in the Z basis.",
      "Change both measurement axes to the X basis. The plus-Bell state still gives only matching outcomes, while the mixture gives all four combinations equally often. This ideal comparison explains why measurement choice matters; an experimental claim also needs calibrated measurements and uncertainty.",
    ],
    takeaway: "Matching results in one basis do not establish entanglement. These two ideal models separate when the measurement basis changes.",
    shows: "A plus-Bell state and a classical 00/11 mixture compared across specified measurement settings on fresh preparations.",
    doesNotShow: "An entanglement-analysis service, an experimental certificate, or the correct XX test for the differently phased ion state without a phase adjustment.",
    technical: {
      paragraphs: [
        "During the source animation, both measurement axes rotate by β from Z toward X in the X–Z plane. The plus-Bell model has correlation 1 throughout that plane; the classical mixture has correlation cos²β. At intermediate settings the outcomes refer to the selected axes, not final X eigenstates.",
        "With zero single-qubit means, each matching outcome has probability (1 + C)/4 and each mismatching outcome (1 − C)/4. At X/X, the mixture therefore gives all four outcomes with probability one quarter.",
        "The ion lesson’s state (|00⟩ − i|11⟩)/√2 has a different relative phase and XX correlation zero. A suitable phase rotation or different measurement axes are required. This comparison does not replace a calibrated witness or characterization protocol.",
      ],
      equations: ["|Φ⁺⟩ = (|00⟩ + |11⟩)/√2", "ρ_mix = (|00⟩⟨00| + |11⟩⟨11|)/2", "C_Bell = 1; C_mix = cos²β", "each matching outcome: (1 + C)/4; each mismatching outcome: (1 − C)/4"],
    },
    sourceIds: ["[5]", "[10]"],
    nextLessonId: "sampling",
    media: media("entanglement", "Bell and classical-mixture probability bars agree in Z/Z; in X/X only the Bell model retains exclusively matching outcomes.", "Figure 10. Z/Z measurements alone give the same outcomes for these two ideal models. X/X measurements distinguish them. During the animation, both measurement axes rotate from Z toward X in the X–Z plane, on fresh preparations. This is a model comparison, not a substitute for a calibrated entanglement witness.", [
      "Compare a plus-Bell state with an ordinary mixture of 00 and 11.",
      "Measure both in Z/Z. Each model gives 00 and 11 equally often.",
      "Rotate both measurement axes toward X using fresh preparations. The mixture’s outcome probabilities spread.",
      "At X/X the Bell state gives matching outcomes only; the mixture gives all four equally. Interpret this as an ideal model comparison.",
    ]),
  },
];

export const ARTICLE4_COMPARISON_NOTE = "Evaluation starting points from V9, not rankings or exclusive applications. Developer names are examples; they do not imply equivalent products, public hardware access, or enabled app backends.";

export const ARTICLE4_TECHNOLOGY_COMPARISON = [
  { technology: "Superconducting circuits", developers: "Google Quantum AI; IBM", useCases: "Repeated circuit experiments; local-interaction models; error-correction research.", question: "Can short operations deliver the required accuracy sooner after routing, measurement, and reset are counted?", sourceIds: ["[8]", "[25]"] },
  { technology: "Trapped ions", developers: "Quantinuum; IonQ", useCases: "Modest-size circuit tests requiring many different qubit pairs to interact, including selected chemistry experiments.", question: "Do fewer extra gates improve the answer enough to justify transport, cooling, and measurement time?", sourceIds: ["[12]", "[26]"] },
  { technology: "Neutral atoms", developers: "QuEra; Atom Computing; Pasqal", useCases: "Suitable many-body models and geometric conflict graphs; separately, digital and logical-computing research.", question: "Do the available interactions fit the model without excessive mapping or operating overhead?", sourceIds: ["[27]", "[28]", "[39]"] },
  { technology: "Photonics", developers: "PsiQuantum; Xanadu", useCases: "Optical processing, modular-system research, and proposed fault-tolerant application machines.", question: "Can the full system supply sufficiently good resources at a useful rate after losses are included?", sourceIds: ["[18]", "[19]"] },
];

export const ARTICLE4_ALGORITHM_COMPARISON = [
  { method: "VQE", requirements: "State preparation, measurements, and classical optimization.", comparison: "Energy error and uncertainty at the full time and cost limit.", sourceIds: ["[2]", "[41]"] },
  { method: "SQD", requirements: "Informative samples, useful subspace coverage, and classical diagonalization.", comparison: "Result quality versus quantum effort and classical solve cost.", sourceIds: ["[36]", "[37]"] },
  { method: "Digital QAOA", requirements: "A circuit that samples candidates for an optimization objective.", comparison: "Feasibility, solution quality, repetitions, and complete runtime.", sourceIds: ["[22]"] },
  { method: "Analog Rydberg MIS", requirements: "A faithful physical mapping and an effective evolution/readout procedure.", comparison: "Mapping overhead, valid answers, solution size, and a strong classical comparison.", sourceIds: ["[3]", "[34]"] },
  { method: "Demanding chemistry QPE", requirements: "Accurate controlled evolution and sufficient overlap with the desired state.", comparison: "A full protected implementation: logical operations, failures, runtime, and resource factories.", sourceIds: ["[1]"] },
];

export const ARTICLE4_ALGORITHM_NOTE = "These methods are alternatives, not mandatory rungs on a maturity ladder. Small QPE demonstrations do not inherently require fault tolerance; demanding chemistry proposals require a different resource and precision budget. Running an algorithm or a small successful test does not establish application advantage.";

export const ARTICLE4_GLOSSARY = [
  { term: "Qubit", definition: "Information represented using two chosen quantum states, labeled 0 and 1. The device can also be in a superposition of them." },
  { term: "Gate", definition: "A controlled operation on one or more qubits. A circuit is an ordered collection of these operations." },
  { term: "Shot", definition: "One execution and measurement of a prepared quantum program." },
  { term: "Readout", definition: "Measurement and signal processing that produce recorded outcomes." },
  { term: "Routing", definition: "Extra operations or movement needed to arrange an interaction." },
  { term: "Coherence", definition: "Preservation of specified state properties; not how long an atom stays trapped." },
  { term: "Leakage", definition: "Population outside the intended computational states." },
  { term: "Fidelity", definition: "A defined state or process similarity measure, not an application-success probability." },
  { term: "Bias", definition: "The difference between an estimator’s mean and the target it should estimate." },
  { term: "Heralding", definition: "A measurement signal that identifies a preparation or event under a stated detection model." },
  { term: "Feed-forward", definition: "Using an earlier measurement to select a later operation." },
  { term: "Logical qubit", definition: "Encoded information protected by a specified implementation." },
];
