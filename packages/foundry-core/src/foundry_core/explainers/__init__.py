"""
Plain-English circuit explainers and code exporters.

These helpers keep educational copy and generated Cirq snippets out of the API
route modules so the shared quantum layer remains reusable.
"""

from typing import Any


def build_cirq_code(template_key: str, metadata: dict[str, Any]) -> str:
    """Return a lightweight Cirq snippet for the requested template."""

    if template_key == "coin_flip":
        repetitions = int(metadata.get("repetitions", 1000))
        return f"""import cirq

q0 = cirq.LineQubit(0)
circuit = cirq.Circuit(
    cirq.H(q0),
    cirq.measure(q0, key="result"),
)

simulator = cirq.Simulator()
result = simulator.run(circuit, repetitions={repetitions})
print(result.histogram(key="result"))"""

    if template_key == "bell_state":
        repetitions = int(metadata.get("repetitions", 1000))
        return f"""import cirq

q0, q1 = cirq.LineQubit.range(2)
circuit = cirq.Circuit(
    cirq.H(q0),
    cirq.CNOT(q0, q1),
    cirq.measure(q0, q1, key="bell"),
)

simulator = cirq.Simulator()
result = simulator.run(circuit, repetitions={repetitions})
print(result.histogram(key="bell"))"""

    if template_key == "grover":
        repetitions = int(metadata.get("repetitions", 1000))
        marked_state = str(metadata.get("marked_state", "11"))
        return f"""import cirq

q0, q1 = cirq.LineQubit.range(2)
circuit = cirq.Circuit(
    cirq.H.on_each(q0, q1),
    cirq.CZ(q0, q1),  # oracle for |{marked_state}>
    cirq.H.on_each(q0, q1),
    cirq.X.on_each(q0, q1),
    cirq.CZ(q0, q1),
    cirq.X.on_each(q0, q1),
    cirq.H.on_each(q0, q1),
    cirq.measure(q0, q1, key="search"),
)

simulator = cirq.Simulator()
result = simulator.run(circuit, repetitions={repetitions})
print(result.histogram(key="search"))"""

    if template_key == "routing":
        repetitions = int(metadata.get("repetitions", 500))
        num_qubits = int(metadata.get("num_qubits", 3))
        qubit_names = ", ".join(f"q{i}" for i in range(num_qubits))
        on_each = ", ".join(f"q{i}" for i in range(num_qubits))
        rotation_lines = "\n".join(
            f"    cirq.rx(2 * beta)(q{i})," for i in range(num_qubits)
        )
        measure_line = ", ".join(f"q{i}" for i in range(num_qubits))
        return f"""import cirq
import numpy as np

{qubit_names} = cirq.LineQubit.range({num_qubits})
gamma = 0.5
beta = 0.3

circuit = cirq.Circuit(
    cirq.H.on_each({on_each}),
    cirq.ZZPowGate(exponent=gamma / np.pi)(q0, q1),
    cirq.ZZPowGate(exponent=gamma / np.pi)(q1, q2),
{rotation_lines}
    cirq.measure({measure_line}, key="route"),
)

simulator = cirq.Simulator()
result = simulator.run(circuit, repetitions={repetitions})
print(result.histogram(key="route"))"""

    if template_key == "chemistry":
        repetitions = int(metadata.get("repetitions", 500))
        theta = float(metadata.get("theta", 0.123))
        return f"""import cirq

q0, q1 = cirq.LineQubit.range(2)
theta = {theta}

circuit = cirq.Circuit(
    cirq.X(q0),
    cirq.ry(theta)(q0),
    cirq.CNOT(q0, q1),
    cirq.ry(-theta)(q0),
    cirq.CNOT(q0, q1),
    cirq.measure(q0, q1, key="energy"),
)

simulator = cirq.Simulator()
result = simulator.run(circuit, repetitions={repetitions})
print(result.histogram(key="energy"))"""

    return "import cirq\n\n# TODO: add code template for this circuit."


def explain_circuit(
    template_key: str,
    metadata: dict[str, Any],
    use_case_title: str | None = None,
) -> str:
    """Return a concise educational explanation for the requested circuit."""

    suffix = f" This example is being framed against {use_case_title}." if use_case_title else ""

    if template_key == "coin_flip":
        return (
            "A Hadamard gate puts one qubit into superposition so the simulator can "
            "show a near-even split between 0 and 1 after measurement." + suffix
        )

    if template_key == "bell_state":
        return (
            "The first qubit is placed into superposition and then linked to the "
            "second with a CNOT gate, creating correlated 00 and 11 outcomes that "
            "illustrate entanglement." + suffix
        )

    if template_key == "grover":
        marked_state = metadata.get("marked_state", "11")
        return (
            f"This toy Grover circuit marks |{marked_state}> and uses one diffuser step "
            "to amplify that state, making the search intuition visible without claiming "
            "real-world advantage." + suffix
        )

    if template_key == "routing":
        num_cities = metadata.get("num_cities", 4)
        return (
            f"This QAOA-style sketch encodes a simplified {num_cities}-city routing "
            "problem, keeping the classical prep and post-processing explicit around a "
            "small quantum kernel." + suffix
        )

    if template_key == "chemistry":
        return (
            "This is a VQE-shaped teaching circuit, not a production chemistry stack. "
            "It shows how a variational ansatz could fit into a simulator-first workflow "
            "before deeper OpenFermion-backed modeling is introduced." + suffix
        )

    return "This circuit is being used as a simulator-first educational example." + suffix
