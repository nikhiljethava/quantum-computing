"""Circuit inspection and simulator helpers for the Cirq Lab.

The helpers in this module stay simulation-first. qsimcirq is imported lazily so
installations without the optional qsim extra still run with Cirq.
"""

from __future__ import annotations

from typing import Any

import cirq
import numpy as np

QSIM_FALLBACK_WARNING = "qsimcirq is not installed; used Cirq simulator instead."
NOISE_METADATA_NOTE = (
    "Educational depolarizing-noise approximation, not a calibrated hardware model."
)


def _sorted_qubits(circuit: cirq.Circuit) -> list[cirq.Qid]:
    return sorted(circuit.all_qubits())


def _measurement_keys(circuit: cirq.Circuit) -> list[str]:
    keys: list[str] = []
    for operation in circuit.all_operations():
        if not cirq.is_measurement(operation):
            continue
        for key in sorted(cirq.measurement_key_names(operation)):
            if key not in keys:
                keys.append(key)
    return keys


def _sampling_circuit(circuit: cirq.Circuit) -> tuple[cirq.Circuit, str]:
    keys = _measurement_keys(circuit)
    if keys:
        return circuit, keys[0]

    qubits = _sorted_qubits(circuit)
    if not qubits:
        raise ValueError("Circuit has no qubits to measure.")

    sampled = cirq.Circuit(circuit)
    sampled.append(cirq.measure(*qubits, key="result"))
    return sampled, "result"


def _histogram_from_result(result: cirq.Result, key: str) -> dict[str, int]:
    measurements = result.measurements.get(key)
    if measurements is None:
        return {}

    width = measurements.shape[1] if len(measurements.shape) > 1 else 1
    counts = result.histogram(key=key)
    return {format(state, f"0{width}b"): int(count) for state, count in counts.items()}


def inspect_circuit(circuit: cirq.Circuit) -> dict[str, Any]:
    """Return basic circuit metrics for compact UI rendering."""

    return {
        "num_qubits": len(circuit.all_qubits()),
        "gate_count": sum(1 for _ in circuit.all_operations()),
        "circuit_depth": len(circuit),
        "measurement_keys": _measurement_keys(circuit),
    }


def build_state_preview(circuit: cirq.Circuit, max_qubits: int = 4) -> dict[str, Any]:
    """Return a small state-vector preview for educational circuits."""

    qubits = _sorted_qubits(circuit)
    num_qubits = len(qubits)
    empty_preview: dict[str, Any] = {
        "available": False,
        "reason": None,
        "top_amplitudes": [],
        "basis_probabilities": [],
    }

    if num_qubits == 0:
        return {**empty_preview, "reason": "Circuit has no qubits to preview."}

    if num_qubits > max_qubits:
        return {
            **empty_preview,
            "reason": f"State preview is limited to {max_qubits} qubits for interactive use.",
        }

    try:
        simulation_circuit = cirq.Circuit(
            operation
            for operation in circuit.all_operations()
            if not cirq.is_measurement(operation)
        )
        result = cirq.Simulator().simulate(simulation_circuit, qubit_order=qubits)
        state_vector = np.asarray(result.final_state_vector)
    except Exception as exc:  # pragma: no cover - defensive guard for Cirq edge cases
        return {**empty_preview, "reason": f"State preview failed: {exc}"}

    entries: list[dict[str, float | str]] = []
    basis_probabilities: list[dict[str, float | str]] = []
    width = num_qubits

    for index, amplitude in enumerate(state_vector):
        probability = float(abs(amplitude) ** 2)
        basis_state = format(index, f"0{width}b")
        basis_probabilities.append(
            {
                "basis_state": basis_state,
                "probability": round(probability, 6),
            }
        )
        entries.append(
            {
                "basis_state": basis_state,
                "real": round(float(np.real(amplitude)), 6),
                "imag": round(float(np.imag(amplitude)), 6),
                "magnitude": round(float(abs(amplitude)), 6),
                "phase": round(float(np.angle(amplitude)), 6),
                "probability": round(probability, 6),
            }
        )

    top_amplitudes = sorted(entries, key=lambda item: float(item["probability"]), reverse=True)[:8]

    return {
        "available": True,
        "reason": None,
        "top_amplitudes": top_amplitudes,
        "basis_probabilities": basis_probabilities,
    }


def run_ideal_histogram(circuit: cirq.Circuit, repetitions: int) -> dict[str, int]:
    """Run the circuit with the default Cirq simulator and return a histogram."""

    sampled_circuit, key = _sampling_circuit(circuit)
    result = cirq.Simulator().run(sampled_circuit, repetitions=repetitions)
    return _histogram_from_result(result, key)


def run_noisy_histogram(
    circuit: cirq.Circuit,
    repetitions: int,
    noise_level: float,
) -> dict[str, int]:
    """Run an educational depolarizing-noise approximation."""

    if noise_level <= 0:
        return run_ideal_histogram(circuit, repetitions)

    sampled_circuit, key = _sampling_circuit(circuit)
    noisy_circuit = sampled_circuit.with_noise(cirq.depolarize(noise_level))
    result = cirq.Simulator().run(noisy_circuit, repetitions=repetitions)
    return _histogram_from_result(result, key)


def run_qsim_histogram(
    circuit: cirq.Circuit,
    repetitions: int,
) -> tuple[dict[str, int], str | None]:
    """Run with qsimcirq when installed, otherwise fall back to Cirq."""

    sampled_circuit, key = _sampling_circuit(circuit)
    try:
        import qsimcirq  # type: ignore[import-not-found]
    except ImportError:
        return run_ideal_histogram(sampled_circuit, repetitions), QSIM_FALLBACK_WARNING

    try:
        result = qsimcirq.QSimSimulator().run(sampled_circuit, repetitions=repetitions)
        return _histogram_from_result(result, key), None
    except Exception as exc:  # pragma: no cover - depends on optional qsim compatibility
        warning = f"qsim simulation failed for this circuit; used Cirq simulator instead. ({exc})"
        return run_ideal_histogram(sampled_circuit, repetitions), warning
