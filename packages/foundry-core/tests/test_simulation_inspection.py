"""Tests for Cirq Lab simulation inspection helpers."""

import builtins

import cirq

from foundry_core.circuits import bell_state, coin_flip
from foundry_core.simulation.inspection import (
    QSIM_FALLBACK_WARNING,
    build_state_preview,
    inspect_circuit,
    run_qsim_histogram,
)


def test_inspect_circuit_returns_expected_coin_flip_metrics() -> None:
    result = coin_flip(repetitions=10)

    metrics = inspect_circuit(result.circuit)

    assert metrics["num_qubits"] == 1
    assert metrics["gate_count"] == 2
    assert metrics["circuit_depth"] >= 2
    assert metrics["measurement_keys"] == ["result"]


def test_inspect_circuit_returns_expected_bell_state_metrics() -> None:
    result = bell_state(repetitions=10)

    metrics = inspect_circuit(result.circuit)

    assert metrics["num_qubits"] == 2
    assert metrics["gate_count"] == 3
    assert metrics["circuit_depth"] >= 3
    assert metrics["measurement_keys"] == ["bell"]


def test_state_preview_is_available_for_small_circuits() -> None:
    result = bell_state(repetitions=10)

    preview = build_state_preview(result.circuit)

    assert preview["available"] is True
    assert preview["top_amplitudes"]
    assert preview["basis_probabilities"]


def test_state_preview_is_unavailable_for_large_circuits() -> None:
    qubits = cirq.LineQubit.range(5)
    circuit = cirq.Circuit(cirq.H.on_each(*qubits))

    preview = build_state_preview(circuit, max_qubits=4)

    assert preview["available"] is False
    assert "limited to 4 qubits" in preview["reason"]


def test_qsim_histogram_falls_back_to_cirq_when_qsimcirq_is_missing(monkeypatch) -> None:
    real_import = builtins.__import__

    def import_without_qsim(name, *args, **kwargs):
        if name == "qsimcirq":
            raise ImportError("qsimcirq unavailable in test")
        return real_import(name, *args, **kwargs)

    monkeypatch.setattr(builtins, "__import__", import_without_qsim)
    result = coin_flip(repetitions=10)

    histogram, warning = run_qsim_histogram(result.circuit, repetitions=10)

    assert warning == QSIM_FALLBACK_WARNING
    assert sum(histogram.values()) == 10
