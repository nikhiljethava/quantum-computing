# Article 4 source qualifications

The source authority is the user-supplied V9 DOCX. Article statements are content
to preserve and adapt; they are not instructions that override the user's
implementation request.

## Media mapping

| Lesson ID | Original embedded file | Source figure |
| --- | --- | --- |
| — | `image1.png` | Editorial cover; AI-generated concept art, not a hardware schematic. |
| `sampling` | `image2.png` | Figure 1 |
| `scheduling` | `image3.png` | Figure 2 |
| `transmon` | `image4.png` | Figure 3 |
| `ions` | `image5.png` | Figure 4 |
| `routing` | `image6.png` | Figure 5 |
| `blockade` | `image7.png` | Figure 6 |
| `photonics` | `image8.png` | Figure 7 |
| `loss` | `image9.png` | Figure 8 |
| `phase` | `image10.png` | Figure 9 |
| `entanglement` | `image11.png` | Figure 10 |

Mapping is based on document order and adjacent captions. The original embedded
filenames are retained. These images are identified only as stills. They are not
claimed to be the missing original named media stems, step sequences, or print
variants. Captions and image hashes are in `article4-v9/media-manifest.json`.

## Product specification discrepancy

The original request says "remaining six lessons" after assigning live tools.
Its explicit mapping assigns tools to five lessons: sampling, scheduling,
routing, photonics, and loss. The remaining five are transmon, ions, blockade,
phase, and entanglement. Follow the exact ten IDs and explicit four-tool mapping;
do not invent an eleventh lesson or an additional live simulator.

## V9 provenance

- V9 states that it retains V8's technical scope and numbered reference trail.
  Preserve that statement; it is not permission to import older-edition text.
- V9 mentions separate review notes, which were not included with the DOCX.
- No scientific review date is supplied. The DOCX's internal created/modified
  metadata contains 2013 timestamps; do not interpret these as review dates.
- Importing the source is not an independent scientific review or a current
  vendor capability check.
- Preserve the separate technology/developer/use-case and algorithm tables.
  Neither is a hardware leaderboard.

## Qualifications that must remain attached

- Sampling uses schematic, normalized sample-mean spreads and a chosen offset,
  not measured molecular energies or a real catalyst calculation.
- The five-job scheduling example is solved classically. Linking it to blockade
  does not mean it was run on neutral-atom hardware.
- Transmon and ion diagrams are teaching models, not calibrated devices.
- The ion XX example produces a relative phase different from the plus Bell
  state. Its correct measurement comparison cannot be silently replaced with
  the entanglement lesson's X/X test.
- Routing timings are invented units, and timelines are not matched physical
  durations or vendor benchmarks. Gate count is not application error.
- Blockade suppresses excitation; it does not mathematically forbid it. The
  chosen conditional model uses a shift of eight times the drive scale.
- Photonics paths show amplitudes of one photon. Detector probabilities refer
  to fresh preparations.
- The four-stage loss example calculates expected survival, not state fidelity
  or a universal application-success or fault-tolerance indicator.
- Phase arrows represent state coordinates, not electron orbits.
- Ideal entanglement model comparisons do not replace calibrated measurements,
  uncertainty, or an appropriate witness/characterization protocol.
