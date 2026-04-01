"""Gemini-backed draft-circuit updates for the Build workspace."""

from __future__ import annotations

import json
from typing import Any

import httpx

from foundry_backend.schemas.schemas import (
    CircuitVisualNodeRead,
    GeminiCircuitUpdateRequest,
    GeminiCircuitUpdateResponse,
)


GEMINI_API_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
)
SUPPORTED_GATE_LABELS = ["H", "X", "Y", "Z", "RX", "RY", "RZ"]
GEMINI_RESPONSE_JSON_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "guide_response": {"type": "string"},
        "explanation": {"type": "string"},
        "nodes": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "type": {
                        "type": "string",
                        "enum": ["gate", "control", "target", "measure", "label"],
                    },
                    "lane": {"type": "integer", "minimum": 0, "maximum": 16},
                    "column": {"type": "integer", "minimum": 0, "maximum": 24},
                    "label": {"type": "string"},
                    "target_lane": {"type": "integer", "minimum": 0, "maximum": 16},
                    "tone": {
                        "type": "string",
                        "enum": ["primary", "secondary", "accent", "warn", "neutral"],
                    },
                },
                "required": ["type", "lane", "column"],
                "additionalProperties": False,
            },
            "minItems": 1,
        },
    },
    "required": ["guide_response", "explanation", "nodes"],
    "additionalProperties": False,
}


class GeminiCircuitError(RuntimeError):
    """Raised when Gemini draft generation fails or returns invalid content."""


def _extract_json_text(raw_text: str) -> str:
    text = raw_text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if len(lines) >= 3:
            return "\n".join(lines[1:-1]).strip()
    return text


def _extract_candidate_text(payload: dict[str, Any]) -> str:
    candidates = payload.get("candidates")
    if not isinstance(candidates, list) or not candidates:
        raise GeminiCircuitError("Gemini returned no candidates for the draft update.")

    content = candidates[0].get("content")
    if not isinstance(content, dict):
        raise GeminiCircuitError("Gemini returned a malformed candidate payload.")

    parts = content.get("parts")
    if not isinstance(parts, list) or not parts:
        raise GeminiCircuitError("Gemini returned no content parts for the draft update.")

    text_fragments = [
        part.get("text")
        for part in parts
        if isinstance(part, dict) and isinstance(part.get("text"), str)
    ]
    if not text_fragments:
        raise GeminiCircuitError("Gemini did not return any text content for the draft update.")

    return "\n".join(text_fragments)


def _quantum_lane_indexes(wires: list[str]) -> list[int]:
    return [index for index, wire in enumerate(wires) if wire.startswith("q")]


def _classical_lane_index(wires: list[str]) -> int | None:
    for index, wire in enumerate(wires):
        if wire.startswith("c"):
            return index
    return None


def _default_tone(node_type: str) -> str:
    if node_type == "measure":
        return "secondary"
    if node_type in {"control", "target"}:
        return "accent"
    if node_type == "label":
        return "neutral"
    return "primary"


def _default_label(node_type: str) -> str | None:
    if node_type == "measure":
        return "M"
    if node_type == "label":
        return "readout"
    if node_type == "gate":
        return "H"
    return None


def _normalize_node(node: CircuitVisualNodeRead, wires: list[str]) -> CircuitVisualNodeRead:
    quantum_lanes = _quantum_lane_indexes(wires)
    classical_lane = _classical_lane_index(wires)
    first_quantum_lane = quantum_lanes[0] if quantum_lanes else 0
    last_quantum_lane = quantum_lanes[-1] if quantum_lanes else first_quantum_lane

    lane = node.lane
    if node.type == "label":
        lane = classical_lane if classical_lane is not None else max(len(wires) - 1, 0)
    elif lane not in quantum_lanes:
        lane = first_quantum_lane

    tone = node.tone or _default_tone(node.type)
    label = node.label.strip() if isinstance(node.label, str) else None

    if node.type == "gate":
        gate_label = (label or "H").upper()
        label = gate_label if gate_label in SUPPORTED_GATE_LABELS else "H"
    elif node.type in {"measure", "label"}:
        label = label or _default_label(node.type)
    else:
        label = None

    target_lane = node.target_lane
    if node.type == "control":
        if target_lane not in quantum_lanes or target_lane == lane:
            candidate_lanes = [candidate for candidate in quantum_lanes if candidate != lane]
            target_lane = candidate_lanes[0] if candidate_lanes else lane
    else:
        target_lane = None

    return CircuitVisualNodeRead(
        type=node.type,
        lane=lane,
        column=max(0, min(node.column, 24)),
        label=label,
        target_lane=target_lane,
        tone=tone,
    )


def _ensure_control_targets(
    nodes: list[CircuitVisualNodeRead], wires: list[str]
) -> list[CircuitVisualNodeRead]:
    normalized = [_normalize_node(node, wires) for node in nodes]
    enriched = list(normalized)

    for node in normalized:
        if node.type != "control":
            continue

        expected_target_lane = node.target_lane if node.target_lane is not None else node.lane
        target_exists = any(
            candidate.type == "target"
            and candidate.column == node.column
            and candidate.lane == expected_target_lane
            for candidate in enriched
        )
        if target_exists:
            continue

        enriched.append(
            CircuitVisualNodeRead(
                type="target",
                lane=expected_target_lane,
                column=node.column,
                tone=node.tone or "accent",
            )
        )

    return sorted(enriched, key=lambda item: (item.column, item.lane, item.type))


def _build_prompt(body: GeminiCircuitUpdateRequest) -> str:
    current_nodes = [
        {
            "type": node.type,
            "lane": node.lane,
            "column": node.column,
            "label": node.label,
            "target_lane": node.target_lane,
            "tone": node.tone,
        }
        for node in body.nodes
    ]

    context = {
        "starter_key": body.starter_key.value if body.starter_key else None,
        "wires": body.wires,
        "prompt": body.prompt,
        "guide_response": body.guide_response,
        "explanation": body.explanation,
        "use_case_title": body.use_case_title,
        "current_nodes": current_nodes,
    }

    return (
        "You are helping edit a toy quantum circuit inside GCP Quantum Foundry.\n"
        "Return a simulation-first draft update only. Do not claim quantum advantage, "
        "hardware access, or benchmark superiority.\n"
        "Keep the same wires list. Do not invent new wires. Use only these node types: "
        "gate, control, target, measure, label.\n"
        "Allowed gate labels: H, X, Y, Z, RX, RY, RZ.\n"
        "For a CNOT-style interaction, emit a control node and a target node in the same column.\n"
        "Measure nodes should usually use label M. Label nodes should usually use label readout "
        "and belong on the classical lane.\n"
        "Keep the explanation concise and educational, and mention that this is a simulator-first draft.\n\n"
        f"User instruction:\n{body.instruction.strip()}\n\n"
        f"Current workspace context:\n{json.dumps(context, indent=2)}"
    )


async def update_circuit_with_gemini(
    body: GeminiCircuitUpdateRequest,
) -> GeminiCircuitUpdateResponse:
    """Request a Gemini-authored draft update for the editable circuit canvas."""

    request_body = {
        "contents": [
            {
                "parts": [
                    {
                        "text": _build_prompt(body),
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json",
            "responseJsonSchema": GEMINI_RESPONSE_JSON_SCHEMA,
        },
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            GEMINI_API_URL.format(model_name=body.model_name),
            headers={
                "Content-Type": "application/json",
                "x-goog-api-key": body.api_key,
            },
            json=request_body,
        )

    if response.status_code >= 400:
        message = response.text
        try:
            payload = response.json()
        except ValueError:
            payload = None

        if isinstance(payload, dict):
            error = payload.get("error")
            if isinstance(error, dict) and isinstance(error.get("message"), str):
                message = error["message"]
        raise GeminiCircuitError(message)

    candidate_text = _extract_candidate_text(response.json())

    try:
        parsed = json.loads(_extract_json_text(candidate_text))
    except json.JSONDecodeError as exc:
        raise GeminiCircuitError("Gemini returned an invalid JSON draft payload.") from exc

    validated = GeminiCircuitUpdateResponse.model_validate(
        {
            **parsed,
            "model_name": body.model_name,
        }
    )

    return GeminiCircuitUpdateResponse(
        model_name=body.model_name,
        guide_response=validated.guide_response.strip(),
        explanation=validated.explanation.strip(),
        nodes=_ensure_control_targets(validated.nodes, body.wires),
    )
