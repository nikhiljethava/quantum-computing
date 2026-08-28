"""Google Colab notebook generation for Algorithm Experiment Workspace runs."""

import json
from typing import Any

from foundry_backend.models.models import ArchitectureRecord, CircuitRun

HARDWARE_ACCESS_GUARDRAIL = (
    "Google quantum hardware access is restricted to approved groups. "
    "Quantum Foundry is simulation-first unless approved access is configured."
)


def _source(text: str) -> list[str]:
    """Return notebook source lines while preserving trailing newlines."""

    return [line + "\n" for line in text.strip().splitlines()]


def _histogram_counts(circuit_run: CircuitRun) -> dict[str, int]:
    """Convert stored histogram entries to a compact state->count map."""

    return {
        str(entry.get("state", "unknown")): int(entry.get("count", 0))
        for entry in circuit_run.histogram
    }


def _architecture_markdown(architecture_record: ArchitectureRecord | None) -> str:
    """Create a Google Cloud architecture note for the notebook."""

    if architecture_record is None:
        return (
            "## Google Cloud architecture context\n\n"
            "This run follows the simulator-first Quantum Foundry pattern: a Next.js "
            "frontend calls a FastAPI service on Cloud Run, circuit runs are handled by "
            "Cirq/qsim-capable worker code, artifacts are stored in Cloud Storage, and "
            "structured product state lives in Cloud SQL. Longer jobs can move through "
            "Cloud Run Jobs or Cloud Tasks when deployed on Google Cloud.\n\n"
            f"{HARDWARE_ACCESS_GUARDRAIL}"
        )

    components = "\n".join(
        f"- **{component.get('name', component.get('id', 'Component'))}**: "
        f"{component.get('description', component.get('service', 'Google Cloud component'))}"
        for component in architecture_record.components
    )
    notes = "\n".join(f"- {note}" for note in architecture_record.notes)
    trust = dict(getattr(architecture_record, "trust_context", {}) or {})
    contract_context = ""
    if getattr(architecture_record, "contract_id", None):
        assumptions = "\n".join(f"- {item}" for item in trust.get("assumptions", []))
        labels = ", ".join(trust.get("trust_labels", [])) or "None recorded"
        contract_context = (
            "\n\n### Algorithm Contract context\n"
            f"- Assessment ID: `{architecture_record.assessment_id}`\n"
            f"- Contract ID: `{architecture_record.contract_id}`\n"
            f"- Problem class: {getattr(architecture_record, 'problem_class', None) or 'N/A'}\n"
            f"- Contract type: {getattr(architecture_record, 'contract_type', None) or 'N/A'}\n"
            f"- Classical baseline: {trust.get('classical_baseline') or 'N/A'}\n"
            f"- Time horizon: {trust.get('time_horizon') or 'N/A'}\n"
            f"- Trust labels: {labels}\n\n"
            f"#### Assumptions\n{assumptions or '- None recorded.'}\n\n"
            "Simulator-first artifact; production advantage is unproven."
        )
    return (
        f"## Google Cloud architecture context\n\n{architecture_record.summary}\n\n"
        f"### Components\n{components or '- No components recorded.'}\n\n"
        f"### Notes\n{notes or f'- {HARDWARE_ACCESS_GUARDRAIL}'}"
        f"{contract_context}"
    )


def generate_colab_notebook(
    circuit_run: CircuitRun,
    architecture_record: ArchitectureRecord | None = None,
) -> dict[str, Any]:
    """Return a runnable Google Colab notebook export for a Cirq circuit run."""

    metadata = circuit_run.run_metadata or {}
    parameters = metadata.get("parameters", {}) if isinstance(metadata.get("parameters"), dict) else {}
    repetitions = int(parameters.get("repetitions") or metadata.get("repetitions") or 1000)
    measurement_keys = metadata.get("measurement_keys") or ["result"]
    measurement_key = str(measurement_keys[0]) if measurement_keys else "result"
    num_qubits = metadata.get("num_qubits", "N/A")
    gate_count = metadata.get("gate_count", "N/A")
    circuit_depth = metadata.get("circuit_depth", "N/A")
    simulator_backend = str(metadata.get("simulator_backend", "cirq"))
    simulator_warning = metadata.get("simulator_warning")
    created_at = getattr(circuit_run, "created_at", None)
    concept = metadata.get("concept", "Cirq simulation")
    label = metadata.get("label", circuit_run.template_key.value.replace("_", " ").title())
    histogram_counts = _histogram_counts(circuit_run)
    qsim_note = (
        "For qsim, install qsimcirq in a compatible environment. qsim is still a "
        "classical simulator path for larger state-vector workloads."
    )

    cells = [
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": _source(
                f"""
                # Quantum Foundry: Tutorial-mode Notebook

                - Circuit: **{label}**
                - Concept: **{concept}**
                - Created at: **{created_at or "Not recorded"}**
                """
            ),
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": _source(
                f"""
                ## Explanation

                {circuit_run.explanation}

                {HARDWARE_ACCESS_GUARDRAIL}
                """
            ),
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": _source(
                f"""
                # If this is a fresh Colab runtime, uncomment the install line:
                # %pip install cirq matplotlib

                import cirq
                import matplotlib.pyplot as plt

                # Optional qsim note: {qsim_note}
                """
            ),
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": _source(circuit_run.cirq_code),
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": _source(
                f"""
                repetitions = {repetitions}
                measurement_key = {measurement_key!r}

                if "circuit" not in globals():
                    raise RuntimeError("Run the Cirq code cell first so `circuit` is defined.")

                simulator = cirq.Simulator()
                result = simulator.run(circuit, repetitions=repetitions)
                print(result)

                stored_histogram = {json.dumps(histogram_counts, sort_keys=True)}
                histogram_data = stored_histogram
                print("Stored Quantum Foundry histogram:", histogram_data)
                """
            ),
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": _source(
                """
                states = list(histogram_data.keys())
                counts = [histogram_data[state] for state in states]

                plt.figure(figsize=(7, 4))
                plt.bar(states, counts, color="#4285F4")
                plt.title("Cirq simulation histogram")
                plt.xlabel("Measured state")
                plt.ylabel("Shot count")
                plt.grid(axis="y", alpha=0.2)
                plt.show()
                """
            ),
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": _source(
                f"""
                ## Circuit metrics

                - Qubits: **{num_qubits}**
                - Gates: **{gate_count}**
                - Depth: **{circuit_depth}**
                - Simulator backend: **{simulator_backend}**
                - Measurement keys: **{", ".join(map(str, measurement_keys)) or "N/A"}**
                {f"- Simulator warning: **{simulator_warning}**" if simulator_warning else ""}
                """
            ),
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": _source(_architecture_markdown(architecture_record)),
        },
    ]

    notebook = {
        "cells": cells,
        "metadata": {
            "kernelspec": {
                "display_name": "Python 3",
                "language": "python",
                "name": "python3",
            },
            "language_info": {
                "name": "python",
                "pygments_lexer": "ipython3",
            },
        },
        "nbformat": 4,
        "nbformat_minor": 5,
    }
    content = json.dumps(notebook, indent=2, sort_keys=True).encode("utf-8")
    return {
        "filename": f"{circuit_run.template_key.value}_colab_notebook.ipynb",
        "content_type": "application/x-ipynb+json",
        "bytes": content,
    }
