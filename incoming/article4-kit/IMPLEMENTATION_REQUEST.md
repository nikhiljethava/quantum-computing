Implement the Article 4 companion in the existing Quantum Foundry app.

Read incoming/article4-kit/CODEX_ARTICLE4_BRIEF.md completely before editing.
That is the detailed implementation specification. Use the supplied
article4-v9/ folder for content, media, references, and numerical fixtures.

The scope is fixed:
- ONE coherent Article 4 companion.
- TEN watchable lessons.
- FOUR interactive educational tools.
- ONE learning-record export, available as JSON and Markdown.

Do not stop at a plan. Implement, test, and report actual results.

1. AUDIT THE CHECKOUT BEFORE EDITING

Read applicable AGENTS.md files and current repository documentation.

Record:
- The branch and starting commit SHA.
- git status --short.
- Any unrelated local changes that must be preserved.

Locate the existing Series registry, companion renderer, source/evidence
components, assessment handoff, analytics helper, test tooling, and frontend
build configuration.

Public documentation points to:
- apps/frontend/src/content/series.ts
- apps/frontend/src/lib/analytics.ts
- docs/ARTICLE_COMPANIONS.md
- docs/QALS_2_WORKBENCH.md
- docs/TESTING.md

Verify these against the actual checkout. Do not assume their schemas or
copy an older implementation from a cached web page.

If Article 4 or a reusable component already exists, extend it rather than
creating a duplicate.

Run python3 validate_handoff.py from the supplied package directory.
This validates files and selected mathematical fixtures—not the app.

Source precedence:
- Actual checkout: existing code and integration contracts.
- Supplied Article 4 V9: scientific content and its qualifications.
- CODEX_ARTICLE4_BRIEF.md: new product behavior and acceptance criteria.

Do not mix older V7/V4 text into V9 or silently replace its scientific
qualifications. Document any source inconsistency.

2. CREATE ONE COMPANION, NOT A SECOND APP

Use /series/04-qubit-technologies unless an equivalent published route
already exists. Preserve an existing published route rather than duplicating it.

Integrate with the existing Series card, metadata, sitemap, and route tests.
Keep the current app shell and navigation.

Opening:
“Which quantum machine is worth testing for your problem?
Explore the article’s examples, change one assumption, and see why a fast
gate or a large qubit count is not the whole answer.”

Offer three entry choices:
- Understand a chemistry experiment → sampling.
- Try the five-job scheduling example → scheduling.
- See how the four machines work → transmon, with links to the other three.

Do not start with a blank workload form or force an assessment before learning.

Every lesson should contain:
- One clear question.
- One or two short explanatory paragraphs.
- One large visual scene.
- Watch and Step through modes.
- Explore mode only when a live tool is implemented.
- A plain-English result or takeaway.
- “What this shows” and “What this does not show.”
- An optional purple Level 400 explanation with equations and sources.
- A relevant next lesson.

The main explanation must work without opening Level 400.
Use complete sentences, short paragraphs, and selective bullets.
Define technical terms where readers first need them.

3. ADD THE TEN LESSONS

Use these exact IDs and supplied media stems:

sampling
scheduling
transmon
ions
routing
blockade
photonics
loss
phase
entanglement

Map live tools as follows:
- sampling → Sampling tool.
- scheduling → Scheduling tool.
- routing → Routing tool.
- photonics and loss → Two separate panels in ONE Optics tool.
- The remaining six lessons → Reviewed media, steps, explanations, and
  technical panels only.

Do not add live pulse simulation, ion-motion simulation, an atom optimizer,
or an entanglement-analysis service in this release.

Keep the qualitative technology/use-case/developer comparison and the
separate algorithm comparison from V9. These are explanatory tables,
not a hardware ranking.

4. IMPLEMENT A REUSABLE MEDIA EXPERIENCE

Each supplied media stem includes:
- MP4.
- GIF.
- Still PNG.
- Four numbered step PNGs.
- Print PNG.

Import assets into the actual frontend build context. Suggested location:
apps/frontend/public/articles/04-qubit-technologies/v9/

Do not embed the complete article HTML, inline base64 media, parse Word
documents at runtime, or create an iframe containing the whole article.

Default to a still. Load the selected MP4 only after Play.
Use native controls and inline playback. No autoplay.

GIF is an explicit alternative:
- Load it only when chosen.
- Stop removes it and restores a still.
- Do not offer a fake GIF pause button.

Switching lessons stops the previous media. Failed playback must fall back
to a still and its explanation rather than leave an empty frame.

Step-through mode changes the image and explanatory text together.
Do not auto-advance.

IMPORTANT: prerecorded media and live controls are different modes.
A slider must never appear to control a prerecorded clip.
Entering Explore stops the clip and displays a live diagram driven by the
same calculation as the displayed numbers.
Returning to Watch says “Watch the preset example” and does not erase
the reader’s live inputs.

Keep important explanations outside the image so they remain readable
on a phone. Support keyboard controls, visible focus, reduced motion,
and non-color indicators.

Use existing charting/animation dependencies or native SVG.
Do not add a heavy 3D framework.

5. BUILD FOUR LIVE TOOLS WITH EXPLICIT MODELS

All calculations run locally in the browser as pure tested functions.
The figure, text, and saved output must use the same model result.

Do not call an LLM, create a quantum job, or invoke the backend to calculate
these examples.

Validate finite numbers, integer fields, and bounds. Blank, invalid, or
out-of-range input should show an inline error and prevent saving.
Do not silently display clamped values as the user’s original inputs.
Round only for display.

TOOL A: SAMPLING VERSUS BIAS

Question: “Will more measurements remove a persistent offset?”

Primary controls:
- Number of samples N.
- Fixed offset b.

Advanced controls:
- Single-sample variance.
- Reference value.

Use normalized teaching units, not fabricated molecular-energy measurements.

Defaults:
N = 100
b = 0.2
variance = 1
reference = 0

Calculate:
expected_estimate = reference + b
standard_error = sqrt(variance / N)
mean_squared_error = b*b + variance/N

With the defaults:
- N=100 gives expected estimate 0.2, standard error 0.1, MSE 0.05.
- N=10,000 gives expected estimate 0.2, standard error 0.01, MSE 0.0401.

Show the reference, expected estimate, and shrinking sampling spread.
Label a one-standard-error band accurately; do not call it a guaranteed
accuracy interval or a 95% confidence interval.

Explain the consequence:
“More samples narrowed the uncertainty. The expected estimate is still
above the reference because this model includes a fixed offset.”

Handle zero and negative offsets with appropriate wording.
For zero variance, draw a point rather than an invalid density.

This is not a VQE optimizer, SQD calculation, QPE implementation, or
catalyst simulation. Do not convert vendor gate infidelity into energy bias.

TOOL B: FIVE-JOB SCHEDULING

Use this exact fixed dataset:

A: Press, inspection
B: Press, drill
C: Drill, mill
D: Mill, oven
E: Oven, inspection

Derive graph edges from shared equipment:
AB, BC, CD, DE, EA.

A job selection must update the equipment list, graph, conflict list, and
result sentence together. State the equipment causing each conflict.

“Check all choices” enumerates all 32 subsets classically.

Expected:
- 11 valid subsets, including the empty set.
- Maximum selection size: 2.
- Five maximum selections: AC, AD, BD, BE, CE.
- A+B is invalid because both need the press.
- A+C is valid.
- Every selection of three or more jobs is invalid.

Distinguish “valid” from “maximum.”
Label this as a classical calculation for the five-job example.

The optional Level 400 objective uses a fixed penalty of 2:
cost = -number_selected + 2 * number_of_selected_conflict_edges

Do not add a general scheduling solver or editable problem formulation.
The link to the blockade lesson explains a relevant physical mechanism;
it does not imply that this app executed the scheduling problem on atoms.

TOOL C: ROUTING OVERHEAD

Start with fixed hardware sites containing states A, X, B.
One SWAP changes their arrangement to X, A, B.
The state labels move; the chip sites do not.

Controls:
- k: 0–5 SWAPs.
- Local operation time.
- Illustrative direct operation time.

Use the stated CNOT-based strategy without restoration:
gate_count = 3*k + 1
local_gate_only_duration = (3*k + 1) * local_time
direct_gate_only_duration = direct_time

Defaults:
k=1, local_time=0.2, direct_time=1.0, in illustrative time units.

Expected:
- k=0: 1 gate, 0.2 units.
- k=1: 4 gates, 0.8 units.
- k=2: 7 gates, 1.4 units.
- Direct comparison: 1.0 unit.

If k changes, show the corresponding number of intermediate positions.
Do not keep a one-SWAP picture while displaying a larger count.

Do not identify these made-up timings as Google, IBM, or ion measurements.
Do not calculate energy error or application success from gate count.
Explain that transport, parallelism, readout, reset, and errors are omitted.

TOOL D: OPTICS — PHASE AND LOSS

Use one tool with two separately labeled panels and outputs.

Phase:
- phi in radians from 0 to pi.
- Presets: 0, pi/2, pi.
- Default: pi/2.

P(D0) = cos(phi/2)^2
P(D1) = sin(phi/2)^2

Expected: 1/0, 0.5/0.5, 0/1.

These are ideal probabilities for fresh preparations, not observed counts.
Show two path amplitudes of one photon, not two photon copies.

Loss:
- Four conditional stage efficiencies, each between 0 and 1.
- Default efficiency: 0.9 at each stage.
- Default launches: 100.

path_efficiency = product(stage_efficiencies)
expected_detections = launches * path_efficiency

Show expected counts after every stage:
100 → 90 → 81 → 72.9 → 65.61.

All-one efficiencies preserve all launches.
A zero stage produces zero expected detections downstream.
Zero launches produces zero counts.

Fractional values are expectations, not observed photon counts.
Do not multiply conditional fidelity into this delivery calculation.
Do not add a universal photonic fault-tolerance indicator.

For exact bounds and edge cases, follow ACCEPTANCE_CASES.json and the brief.

6. CREATE ONE LEARNING-RECORD EXPORT

“Save this example” captures a valid live-tool observation.
“Export learning record” offers JSON and Markdown.

Save a snapshot, not a reference to mutable slider state.
Subsequent edits must not silently change earlier observations.
Allow removing observations and clearing the collection.

Use browser memory for the current visit. Clearly say that refreshing
clears the record. No database, account persistence, or import feature.

Include:
- Record schema version.
- Article revision: article4-v9.
- Record creation timestamp.
- Observation capture timestamp.
- Lesson ID, model ID, and model version.
- Inputs and input units.
- Calculated outputs and output units.
- Assumptions and omitted factors.
- Source references.
- Execution kind: browser educational model.
- A notice that this is not a hardware benchmark or approved contract.

Generate both export formats from the same saved record.
Watching a video does not create a measured result.
An empty record should ask the reader to save an example.

Do not include credentials, user identity, private app records, invented
assessment IDs, or arbitrary browser-provided URLs.

7. PRESERVE THE EXISTING APP’S BOUNDARIES

Reuse the existing Series registry, evidence presentation, canonical-link
configuration, and typed analytics where appropriate.

Do not create a parallel CMS or another application.
Suggested module boundaries in the detailed brief are suggestions, not
a requirement to duplicate existing components.

Keep the original source IDs and qualifications.
Do not assign a hardware confidence score to a conceptual drawing.
Do not update scientific review dates merely because content was imported.

“Assess my own problem” may enter the existing assessment flow.
Transfer only context supported by its validated parser.
Do not auto-submit, inject sample evidence, or unlock Build.

Keep all backend assessment and worker eligibility checks unchanged.

Do not claim that a toy chemistry starter runs the catalyst calculation.
Do not send this MIS lesson into an unrelated routing template and call
it the same experiment.

The four tools and local export must remain usable when API or analytics
requests fail.

8. ADD SAFE DEEP LINKS AND ARTICLE LINKS

Allowlist lesson IDs and levels 100 or 400.

Examples:
?lesson=sampling&level=100
?lesson=scheduling&level=100
?lesson=routing&level=100
?lesson=photonics&level=400
?lesson=loss&level=100

Missing, invalid, or duplicated values resolve predictably to safe defaults.
Support reload and Back/Forward.

Copy lesson link includes only lesson and level. It opens the lesson,
not an exact saved slider state. Do not imply otherwise.

Use the existing canonical-link pattern.
Proposed configuration:
NEXT_PUBLIC_SERIES_ARTICLE_04_URL

Leave it empty until the real Article 4 publication URL is supplied.
Only valid absolute HTTPS URLs are accepted; reject embedded credentials.
Hide the article CTA when the value is empty or invalid.
Do not accept a returnTo destination from query parameters.

Wire public configuration into the actual production frontend build.
Preserve the existing Docker and Cloud Build approach.
Do not assume runtime-only Cloud Run environment changes update client code.

Write docs/ARTICLE_04_LINKS.md with:
- The companion route.
- Exact lesson destinations.
- Suggested article link text.
- Deployment verification status.

Do not invent a public hostname or claim an undeployed link works.

9. TEST THE READER EXPERIENCE, NOT ONLY THE FUNCTIONS

Reuse the current test tools and package commands.
Do not upgrade frameworks or remove checks merely to make tests pass.

Required checks:
- All ten lesson pages/states, references, stills, videos, GIFs, and steps.
- Numerical agreement with the supplied independent fixtures.
- All 32 scheduling subsets and the five maximum selections.
- Zero variance, zero transmission, zero launches, k=0, and routing ties.
- Invalid numeric input and probability bounds.
- Figures, text, and exports agree.
- Saved observations remain unchanged after subsequent input edits.
- No MP4/GIF network request before explicit playback.
- Switching lessons stops the previous media.
- GIF Stop restores a still.
- Playback failure has a usable fallback.
- Keyboard navigation, visible focus, reduced motion, 360px layout,
  200% zoom, and readable table alternatives.
- Safe query handling and working Back/Forward.
- Hidden external CTA when the article URL is absent or invalid.
- Correct URL and assets in the production build.
- Lessons and exports remain usable with backend/analytics unavailable.
- Articles 1 and 2, assessment, Build, and Map do not regress.
- No reading or export action creates a quantum job or changes eligibility.

Use typed analytics only for allowlisted lesson/mode/export events.
Do not send raw slider inputs, records, or user-entered text.
Event failure cannot block the experience.

10. DELIVER IN THREE REVIEWABLE STAGES

Stage 1: Companion, source content, and media.
Stage 2: Four interactive tools and learning-record export.
Stage 3: Integration, tests, and documentation.

Continue through all three stages unless genuinely blocked.
Do not deploy to production without the normal approval process.

Final report:
- Starting commit.
- Files changed and existing components reused.
- Feature checklist: completed, incomplete, or blocked.
- Exact test/build commands and actual results.
- Desktop and mobile screenshots.
- Measured media-loading behavior.
- Known limitations and deployment steps.

Do not describe planned, skipped, or failed checks as passed.