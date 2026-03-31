"""
Circuit factories.

Each factory returns a CircuitResult — a typed container holding the Cirq circuit,
its measurement results after simulation, and metadata for the frontend.
"""

import dataclasses
from typing import Any

import cirq
import numpy as np


@dataclasses.dataclass
class CircuitResult:
    """Typed result returned by every circuit factory."""

    circuit_text: str
    """String diagram of the Cirq circuit."""

    measurements: dict[str, list[int]]
    """Measurement results keyed by register name. Values are lists of 0/1 ints."""

    histogram: dict[str, int]
    """Outcome-string → count histogram over repetitions."""

    metadata: dict[str, Any]
    """Circuit-specific metadata (num_qubits, num_gates, description, etc.)."""


def _simulate(circuit: cirq.Circuit, repetitions: int = 1000) -> cirq.Result:
    simulator = cirq.Simulator()
    return simulator.run(circuit, repetitions=repetitions)


def coin_flip(repetitions: int = 100) -> CircuitResult:
    """
    Single-qubit Hadamard circuit — the quantum 'Hello World'.

    Demonstrates superposition: a qubit put in equal superposition measures
    0 or 1 with equal probability.
    """
    q = cirq.LineQubit.range(1)[0]
    circuit = cirq.Circuit([cirq.H(q), cirq.measure(q, key="result")])
    result = _simulate(circuit, repetitions=repetitions)

    counts = result.histogram(key="result")
    histogram = {format(k, "01b"): v for k, v in counts.items()}

    return CircuitResult(
        circuit_text=str(circuit),
        measurements={"result": list(map(int, result.measurements["result"].flatten()))},
        histogram=histogram,
        metadata={
            "name": "Coin Flip",
            "num_qubits": 1,
            "description": "A single qubit in superposition — the quantum equivalent of flipping a perfectly fair coin.",
            "concept": "Superposition",
            "repetitions": repetitions,
        },
    )


def bell_state(repetitions: int = 1000) -> CircuitResult:
    """
    Two-qubit Bell state — demonstrates entanglement.

    After measuring the first qubit, the second is perfectly correlated.
    This is the foundation of quantum teleportation and superdense coding.
    """
    q0, q1 = cirq.LineQubit.range(2)
    circuit = cirq.Circuit(
        [cirq.H(q0), cirq.CNOT(q0, q1), cirq.measure(q0, q1, key="bell")]
    )
    result = _simulate(circuit, repetitions=repetitions)

    counts = result.histogram(key="bell")
    histogram = {format(k, "02b"): v for k, v in counts.items()}

    return CircuitResult(
        circuit_text=str(circuit),
        measurements={"bell": list(map(int, result.measurements["bell"].flatten()))},
        histogram=histogram,
        metadata={
            "name": "Bell State",
            "num_qubits": 2,
            "description": "Two entangled qubits: measuring one instantly determines the other, no matter the distance.",
            "concept": "Entanglement",
            "repetitions": repetitions,
        },
    )


def grover_search(num_qubits: int = 2, marked_state: int = 3, repetitions: int = 1000) -> CircuitResult:
    """
    Toy Grover's algorithm — searches an unsorted list in O(√N) queries.

    For 2 qubits (4 states) with marked_state=3 (|11⟩), one Grover iteration
    amplifies the target state to near-certainty.
    """
    if num_qubits < 2 or num_qubits > 4:
        raise ValueError("num_qubits must be between 2 and 4 for this toy implementation.")

    n = num_qubits
    qubits = cirq.LineQubit.range(n)

    # ----- Oracle: phase-flip the marked state -----
    oracle_ops: list[cirq.Operation] = []
    # Flip qubits that are 0 in the marked state so CNOT targets all-1 state
    for i, q in enumerate(qubits):
        if not (marked_state >> (n - 1 - i)) & 1:
            oracle_ops.append(cirq.X(q))
    # Multi-controlled Z via Pauli-Z on last qubit with controls
    if n == 2:
        oracle_ops.append(cirq.CZ(*qubits))
    else:
        oracle_ops.append(cirq.Z(qubits[-1]).controlled_by(*qubits[:-1]))
    # Undo bit flips
    for i, q in enumerate(qubits):
        if not (marked_state >> (n - 1 - i)) & 1:
            oracle_ops.append(cirq.X(q))

    # ----- Diffuser -----
    diffuser_ops: list[cirq.Operation] = (
        [cirq.H.on_each(*qubits)]
        + [cirq.X.on_each(*qubits)]
        + ([cirq.CZ(*qubits)] if n == 2 else [cirq.Z(qubits[-1]).controlled_by(*qubits[:-1])])
        + [cirq.X.on_each(*qubits)]
        + [cirq.H.on_each(*qubits)]
    )

    # Number of iterations: floor(π/4 * √(2^n))
    iterations = max(1, round(np.pi / 4 * np.sqrt(2**n)))

    circuit = cirq.Circuit()
    circuit.append(cirq.H.on_each(*qubits))  # Superposition
    for _ in range(iterations):
        circuit.append(oracle_ops)
        circuit.append(diffuser_ops)
    circuit.append(cirq.measure(*qubits, key="search"))

    result = _simulate(circuit, repetitions=repetitions)
    counts = result.histogram(key="search")
    histogram = {format(k, f"0{n}b"): v for k, v in counts.items()}

    return CircuitResult(
        circuit_text=str(circuit),
        measurements={"search": list(map(int, result.measurements["search"].flatten()))},
        histogram=histogram,
        metadata={
            "name": "Grover Search",
            "num_qubits": n,
            "marked_state": format(marked_state, f"0{n}b"),
            "iterations": iterations,
            "description": f"Grover's algorithm finds the marked state |{format(marked_state, f'0{n}b')}⟩ with quadratic speedup over classical search.",
            "concept": "Amplitude Amplification",
            "repetitions": repetitions,
        },
    )


def toy_routing_optimization(num_cities: int = 4, repetitions: int = 500) -> CircuitResult:
    """
    Toy QAOA-inspired routing optimization.

    Uses a simplified cost Hamiltonian for a small travelling-salesman-like problem.
    NOT a production QAOA — illustrates how quantum circuits can encode combinatorial cost.
    """
    # One qubit per binary route variable (conceptual placeholder)
    n = num_cities - 1  # simplify to n binary decisions
    qubits = cirq.LineQubit.range(n)

    # Layer 1: Superposition
    circuit = cirq.Circuit(cirq.H.on_each(*qubits))

    # Layer 2: Cost layer (ZZ interactions between adjacent qubits)
    gamma = 0.5  # QAOA phase angle (fixed for toy)
    beta = 0.3   # QAOA mixer angle (fixed for toy)

    for i in range(n - 1):
        circuit.append(cirq.ZZPowGate(exponent=gamma / np.pi)(qubits[i], qubits[i + 1]))

    # Layer 3: Mixer layer (X rotations)
    circuit.append([cirq.rx(2 * beta)(q) for q in qubits])
    circuit.append(cirq.measure(*qubits, key="route"))

    result = _simulate(circuit, repetitions=repetitions)
    counts = result.histogram(key="route")
    histogram = {format(k, f"0{n}b"): v for k, v in counts.items()}

    return CircuitResult(
        circuit_text=str(circuit),
        measurements={"route": list(map(int, result.measurements["route"].flatten()))},
        histogram=histogram,
        metadata={
            "name": "Toy Routing Optimization",
            "num_qubits": n,
            "num_cities": num_cities,
            "description": f"A simplified QAOA-inspired circuit encoding a {num_cities}-city routing problem. Demonstrates how quantum circuits can explore combinatorial solution spaces.",
            "concept": "QAOA / Combinatorial Optimization",
            "note": "This is a pedagogical toy — real routing would require many more qubits and QAOA layers.",
            "repetitions": repetitions,
        },
    )


def toy_chemistry(repetitions: int = 500) -> CircuitResult:
    """
    Placeholder toy chemistry circuit — H2 molecule energy estimation sketch.

    Uses a parametrized ansatz (hardware-efficient) to sketch VQE-like structure.
    NOT a real VQE — demonstrates the form of a variational quantum eigensolver.
    TODO(roadmap): integrate OpenFermion qubitization for real molecular Hamiltonians.
    """
    q0, q1 = cirq.LineQubit.range(2)

    # Hartree-Fock initial state
    circuit = cirq.Circuit([cirq.X(q0)])

    # Parametrized excitation (θ fixed for illustration)
    theta = 0.123  # approximate optimal angle for toy H2 at bond length ~0.74 Å
    circuit.append(cirq.ry(theta)(q0))
    circuit.append(cirq.CNOT(q0, q1))
    circuit.append(cirq.ry(-theta)(q0))
    circuit.append(cirq.CNOT(q0, q1))
    circuit.append(cirq.measure(q0, q1, key="energy"))

    result = _simulate(circuit, repetitions=repetitions)
    counts = result.histogram(key="energy")
    histogram = {format(k, "02b"): v for k, v in counts.items()}

    return CircuitResult(
        circuit_text=str(circuit),
        measurements={"energy": list(map(int, result.measurements["energy"].flatten()))},
        histogram=histogram,
        metadata={
            "name": "Toy Chemistry (H₂ VQE Sketch)",
            "num_qubits": 2,
            "description": "A parametrized 2-qubit ansatz sketching the structure of VQE for H₂. Illustrates how quantum circuits can estimate molecular ground-state energies.",
            "concept": "Variational Quantum Eigensolver (VQE)",
            "note": "Real VQE requires gradient-based optimization loops and OpenFermion qubitization. See TODO(roadmap) in source.",
            "theta": theta,
            "repetitions": repetitions,
        },
    )


# Maps job_type string → factory function
CIRCUIT_REGISTRY: dict[str, Any] = {
    "coin_flip": coin_flip,
    "bell_state": bell_state,
    "grover": grover_search,
    "routing": toy_routing_optimization,
    "chemistry": toy_chemistry,
}
