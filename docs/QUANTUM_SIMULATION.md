# Quantum Simulation

Quantum Foundry is an independent personal project and is not an official Google product.

## Simulation-First Approach

Quantum Foundry runs educational simulations first. Cirq is the primary SDK. qsim/qsimcirq is optional and loaded only when available.

## Implemented

- Cirq templates: coin flip, Bell state, Grover toy search, toy routing/QAOA-style example, toy chemistry sketch.
- Histograms from simulator runs.
- Circuit metrics: qubits, gate count, depth, measurement keys.
- State preview for small circuits.
- Educational depolarizing-noise comparison.
- Colab notebook export.

## Partially Implemented

- qsim fallback: the API can request qsim and gracefully fall back to Cirq when qsimcirq is unavailable.
- Edited-circuit UI: visual edits are represented in the UI and code draft, but full arbitrary edited-circuit execution remains limited.
- OpenFermion: learning content and hooks exist, but no full chemistry engine is shipped.

## Limitations

- Noise mode is an educational approximation, not a calibrated hardware model.
- Circuit results are educational prototypes unless explicitly validated.
- No quantum advantage is claimed.
