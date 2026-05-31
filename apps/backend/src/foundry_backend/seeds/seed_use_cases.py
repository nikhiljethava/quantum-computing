"""
Seed script — populates use_cases table with curated industry examples.

Run this after `alembic upgrade head`:
    cd apps/backend
    python -m foundry_backend.seeds.seed_use_cases

The script is update-friendly: existing use cases are refreshed by title so new
featured metadata can be applied without manual deletes.
"""

import asyncio
import sys
from pathlib import Path

from sqlalchemy import select

# Make src importable when run directly
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "src"))

from foundry_backend.db.session import AsyncSessionLocal
from foundry_backend.models.models import IndustryTag, UseCase

HARDWARE_ACCESS_NOTE = (
    "Google quantum hardware access is restricted to approved groups. "
    "Quantum Foundry is simulation-first unless approved access is configured."
)

TITLE_SLUGS = {
    "Portfolio Optimization": "portfolio-optimization",
    "Credit Risk Simulation (Monte Carlo)": "credit-risk-simulation-monte-carlo",
    "Molecular Docking & Drug Design": "molecular-docking-drug-design",
    "Genomics Sequence Alignment": "genomics-sequence-alignment",
    "Vehicle Routing Optimization": "vehicle-routing-optimization",
    "Supply Chain Network Design": "supply-chain-network-design",
    "Power Grid Scheduling": "power-grid-scheduling",
    "Battery Material Discovery": "battery-material-discovery",
    "Post-Quantum Cryptography Readiness": "post-quantum-cryptography-readiness",
    "Aerodynamic Simulation": "aerodynamic-simulation",
    "Satellite Orbit Scheduling": "satellite-orbit-scheduling",
    "Catalyst Design for Green Chemistry": "catalyst-design",
}

DEFAULT_GOOGLE_STACK = [
    "Cirq",
    "qsim",
    "Cloud Run Jobs",
    "Cloud Storage",
    "BigQuery",
    "Vertex AI Gemini",
    "Google Colab",
]

FEATURED_BLUEPRINT_EXTRAS = {
    "Battery Material Discovery": {
        "google_stack": ["Cirq", "OpenFermion", "qsim", "Cloud Run Jobs", "Cloud Storage", "BigQuery", "Google Colab"],
        "maturity_label": "pilot_carefully",
        "recommended_lessons": ["why-chemistry-is-hard", "hamiltonians", "small-molecule-story"],
        "recommended_labs": ["chemistry"],
        "google_cloud_architecture_notes": [
            "Use Cloud Storage for molecular inputs, fragment definitions, and simulation artifacts.",
            "Keep the DFT / classical HPC workflow attached as the declared classical baseline.",
            "Use a molecule-fragment starter before claiming any future-hardware upside.",
        ],
        "hardware_access_note": HARDWARE_ACCESS_NOTE,
    },
    "Post-Quantum Cryptography Readiness": {
        "google_stack": ["Cloud Run", "Cloud SQL", "Cloud Storage", "BigQuery"],
        "maturity_label": "simulate_now",
        "recommended_lessons": ["simulation-first-architecture"],
        "recommended_labs": [],
        "google_cloud_architecture_notes": [
            "Use Cloud SQL for crypto asset inventory state and migration ownership.",
            "Use Cloud Storage for exported readiness memos and evidence files.",
            "No quantum hardware path is needed for the default PQC migration-now workflow.",
        ],
        "hardware_access_note": "PQC migration is a classical security modernization workflow; QKD and quantum hardware are not default recommendations.",
    },
    "Portfolio Optimization": {
        "google_stack": DEFAULT_GOOGLE_STACK,
        "maturity_label": "simulate_now",
        "recommended_lessons": ["qaoa-intuition", "measurement-histograms", "simulation-first-architecture"],
        "recommended_labs": ["routing"],
        "google_cloud_architecture_notes": [
            "Use BigQuery or Cloud Storage for portfolio inputs and benchmark results.",
            "Run Cirq/qsim simulations through Cloud Run Jobs for repeatable experiments.",
            "Export Colab notebooks so quant teams can inspect assumptions and histograms.",
        ],
        "hardware_access_note": HARDWARE_ACCESS_NOTE,
    },
    "Molecular Docking & Drug Design": {
        "google_stack": ["Cirq", "OpenFermion", "qsim", "Cloud Run Jobs", "Cloud Storage", "Vertex AI Gemini", "Google Colab"],
        "maturity_label": "pilot_carefully",
        "recommended_lessons": ["why-chemistry-is-hard", "hamiltonians", "small-molecule-story"],
        "recommended_labs": ["chemistry"],
        "google_cloud_architecture_notes": [
            "Keep molecular inputs and generated Hamiltonians in Cloud Storage.",
            "Use OpenFermion content for chemistry education and Cirq for toy circuit simulation.",
            "Treat larger molecular systems as research-only until hardware and active-space assumptions are explicit.",
        ],
        "hardware_access_note": HARDWARE_ACCESS_NOTE,
    },
    "Vehicle Routing Optimization": {
        "google_stack": DEFAULT_GOOGLE_STACK,
        "maturity_label": "simulate_now",
        "recommended_lessons": ["qaoa-intuition", "grover-search", "cloud-run-jobs"],
        "recommended_labs": ["routing"],
        "google_cloud_architecture_notes": [
            "Use BigQuery for route history and Cloud Storage for bounded benchmark instances.",
            "Run simulator sweeps through Cloud Run Jobs or Cloud Tasks-backed workers.",
            "Post-process candidate routes in the backend before exporting planner-facing artifacts.",
        ],
        "hardware_access_note": HARDWARE_ACCESS_NOTE,
    },
}

SEED_DATA: list[dict] = [
    {
        "title": "Portfolio Optimization",
        "industry": IndustryTag.finance,
        "description": (
            "Find the optimal allocation of assets in a large portfolio that maximizes "
            "return for a given risk tolerance. Constrained combinatorial problem."
        ),
        "quantum_approach": (
            "Quantum Approximate Optimization Algorithm (QAOA) or VQE to encode the "
            "Markowitz quadratic program as a QUBO. Near-term hybrid: quantum suggests "
            "candidates, classical solver refines."
        ),
        "complexity_score": 3.5,
        "horizon": "near-term",
        "featured": False,
        "featured_rank": None,
        "blueprint": {
            "persona": "Head of portfolio engineering at a multi-asset investment team",
            "business_kpi": "Improve risk-adjusted return while staying inside issuer, sector, and turnover limits",
            "classical_baseline": (
                "Mixed-integer and heuristic optimizers can handle daily rebalances, but "
                "the search space expands quickly when compliance, liquidity, and scenario constraints stack up."
            ),
            "hybrid_pattern": (
                "Classical factor model and constraint builder -> quantum or quantum-inspired "
                "sampler proposes candidate portfolios -> classical local search and policy checks finalize the trade list."
            ),
            "pilot_scope_weeks": 8,
            "sample_input": (
                "250 assets with expected return, covariance matrix, sector limits, duration bands, "
                "turnover caps, and ESG exclusions."
            ),
            "success_thresholds": [
                "Match or improve the classical heuristic objective within a 1-2% gap on the pilot basket",
                "Produce feasible candidate portfolios under all hard allocation constraints",
                "Generate scenario-ready trade candidates within analyst review time windows",
            ],
            "next_90_days": [
                "Select one constrained rebalance workflow and freeze the policy envelope",
                "Benchmark classical heuristics, simulated quantum runs, and quantum-inspired baselines on the same basket",
                "Document where hybrid search improves candidate diversity or time-to-decision",
            ],
        },
        "evidence_items": [
            {
                "title": "IBM and Vanguard explore quantum portfolio optimization",
                "publisher": "IBM Quantum",
                "published_at": "2025-09-29",
                "claim": (
                    "IBM described a hybrid portfolio construction study with Vanguard that combined "
                    "quantum optimization and classical local search on realistic constraint sets."
                ),
                "source_url": "https://www.ibm.com/quantum/blog/vanguard-portfolio-optimization",
            },
            {
                "title": "Best practices for portfolio optimization by quantum computing, experimented on real quantum devices",
                "publisher": "Scientific Reports",
                "published_at": "2023-11-08",
                "claim": (
                    "The study tested portfolio optimization workflows on real quantum devices and "
                    "simulators, showing the importance of careful formulation and benchmarking rather than overclaiming utility."
                ),
                "source_url": "https://www.nature.com/articles/s41598-023-45392-w",
            },
        ],
    },
    {
        "title": "Credit Risk Simulation (Monte Carlo)",
        "industry": IndustryTag.finance,
        "description": (
            "Estimate Value-at-Risk by sampling thousands of scenarios. "
            "Classical Monte Carlo scales linearly with precision requirements."
        ),
        "quantum_approach": (
            "Quantum amplitude estimation provides quadratic speedup over classical Monte Carlo "
            "for integration tasks. Requires fault-tolerant hardware — long-term target."
        ),
        "complexity_score": 4.0,
        "horizon": "long-term",
        "featured": False,
        "featured_rank": None,
    },
    {
        "title": "Molecular Docking & Drug Design",
        "industry": IndustryTag.pharma,
        "description": (
            "Compute binding energies between candidate drug molecules and protein targets. "
            "Ground-state energy estimation is classically exponential in molecule size."
        ),
        "quantum_approach": (
            "Variational Quantum Eigensolver (VQE) or Quantum Phase Estimation (QPE) to "
            "estimate molecular ground-state energies. OpenFermion + Cirq pipeline. "
            "Mid-term: small molecules; long-term: complex proteins."
        ),
        "complexity_score": 4.5,
        "horizon": "mid-term",
        "featured": False,
        "featured_rank": None,
        "blueprint": {
            "persona": "Director of computational chemistry supporting lead optimization",
            "business_kpi": "Reduce false positives in candidate ranking and shorten the cycle between docking review and wet-lab follow-up",
            "classical_baseline": (
                "Docking, DFT, and QM/MM workflows already guide medicinal chemistry, but "
                "higher-fidelity energy calculations become expensive when the ligand set and active-space complexity grow."
            ),
            "hybrid_pattern": (
                "Classical docking narrows candidate poses -> quantum chemistry subroutine estimates "
                "electronic energies for the hardest fragments -> classical scoring and medicinal chemistry review prioritize compounds."
            ),
            "pilot_scope_weeks": 10,
            "sample_input": (
                "A focused lead series with 20-40 candidate ligands, one protein pocket, "
                "docking poses, and a short list of fragments where electronic structure dominates the uncertainty."
            ),
            "success_thresholds": [
                "Re-rank a small ligand panel with better agreement to reference quantum chemistry than the baseline heuristic alone",
                "Keep the quantum step scoped to a fragment or active-space region that fits simulator budgets",
                "Produce a medicinal-chemistry-ready brief that explains which compounds move forward and why",
            ],
            "next_90_days": [
                "Define one fragment-level study where binding uncertainty materially affects project decisions",
                "Connect docking output, OpenFermion transforms, and simulator runs into a reproducible benchmark",
                "Compare hybrid ranking against existing computational chemistry and retrospective assay data",
            ],
        },
        "evidence_items": [
            {
                "title": "Drug design on quantum computers",
                "publisher": "Nature Physics",
                "published_at": "2024-03-04",
                "claim": (
                    "A cross-industry perspective from pharma and quantum researchers outlines where "
                    "quantum methods could fit drug design workflows and where significant hardware and algorithmic gaps remain."
                ),
                "source_url": "https://www.nature.com/articles/s41567-024-02411-5",
            },
            {
                "title": "A hybrid quantum computing pipeline for real world drug discovery",
                "publisher": "Scientific Reports",
                "published_at": "2024-07-23",
                "claim": (
                    "The paper presents a hybrid workflow aimed at real drug-discovery tasks, including "
                    "reaction barriers and QM/MM-style simulations, as a bridge from proofs of concept toward practical workflows."
                ),
                "source_url": "https://www.nature.com/articles/s41598-024-67897-8",
            },
        ],
    },
    {
        "title": "Genomics Sequence Alignment",
        "industry": IndustryTag.pharma,
        "description": (
            "Align large genomic sequences for variant calling and comparative genomics. "
            "Classical approximate algorithms already work well but miss rare variants."
        ),
        "quantum_approach": (
            "Grover-based search can offer quadratic speedup for exact alignment on structured "
            "databases. Still theoretical at genomic scale. Exploratory horizon."
        ),
        "complexity_score": 3.0,
        "horizon": "long-term",
        "featured": False,
        "featured_rank": None,
    },
    {
        "title": "Vehicle Routing Optimization",
        "industry": IndustryTag.logistics,
        "description": (
            "Determine optimal delivery routes for a fleet of vehicles across hundreds of "
            "stops under time and capacity constraints. NP-hard combinatorial problem."
        ),
        "quantum_approach": (
            "QAOA encoding of the VRP QUBO, solved as a hybrid quantum-classical loop. "
            "Current NISQ devices can tackle toy instances (< 20 stops). "
            "Near-term hybrid: quantum warm-starts for classical solvers."
        ),
        "complexity_score": 3.5,
        "horizon": "near-term",
        "featured": True,
        "featured_rank": 2,
        "blueprint": {
            "persona": "Operations research lead for last-mile delivery or field service routing",
            "business_kpi": "Reduce route cost and late deliveries while preserving planner trust in the dispatch workflow",
            "classical_baseline": (
                "Classical VRP solvers handle most daily planning well, but re-optimizing under "
                "capacity, time windows, heterogeneous fleets, and disruption scenarios grows expensive and brittle."
            ),
            "hybrid_pattern": (
                "Classical preprocessing builds the feasible stop clusters -> quantum or quantum-inspired "
                "optimizer searches difficult route subproblems -> classical dispatcher validates and integrates the result into the planning stack."
            ),
            "pilot_scope_weeks": 6,
            "sample_input": (
                "A single depot with 40-80 stops, time windows, vehicle capacities, shift limits, "
                "and historical travel-time variability."
            ),
            "success_thresholds": [
                "Beat or match the incumbent heuristic on a defined route subset with measurable dispatch KPIs",
                "Show stable route quality across repeated runs and disruption scenarios",
                "Produce an export the operations team can review without learning quantum tooling",
            ],
            "next_90_days": [
                "Choose one bounded routing region and freeze the operational constraints for benchmarking",
                "Benchmark classical heuristics, simulated QAOA-style runs, and quantum-inspired baselines on the same dataset",
                "Document where hybrid subproblem solving improves planner options or solve times",
            ],
        },
        "evidence_items": [
            {
                "title": "Solving a real-world package delivery routing problem using quantum annealers",
                "publisher": "Scientific Reports",
                "published_at": "2024-10-21",
                "claim": (
                    "The paper studies a package-delivery routing problem with quantum annealers, "
                    "showing that real logistics formulations are already being benchmarked beyond toy textbook examples."
                ),
                "source_url": "https://www.nature.com/articles/s41598-024-75572-1",
            },
            {
                "title": "Applying quantum approximate optimization to the heterogeneous vehicle routing problem",
                "publisher": "Scientific Reports",
                "published_at": "2024-10-25",
                "claim": (
                    "This work applies QAOA-style methods to a heterogeneous vehicle routing problem, "
                    "reinforcing that routing remains a credible simulator-first hybrid benchmark rather than a hardware-ready production path."
                ),
                "source_url": "https://www.nature.com/articles/s41598-024-76967-w",
            },
        ],
    },
    {
        "title": "Supply Chain Network Design",
        "industry": IndustryTag.logistics,
        "description": (
            "Optimize warehouse locations, inventory levels, and supplier selection "
            "across a multi-tier global supply chain."
        ),
        "quantum_approach": (
            "Mixed-integer program encoded as QUBO for quantum annealing or QAOA. "
            "Hybrid approach: quantum sub-problem decomposition embedded in classical MIP solver."
        ),
        "complexity_score": 4.0,
        "horizon": "mid-term",
        "featured": False,
        "featured_rank": None,
    },
    {
        "title": "Power Grid Scheduling",
        "industry": IndustryTag.energy,
        "description": (
            "Schedule generation units and renewable sources to meet demand at minimum cost "
            "while satisfying grid stability constraints. Large-scale MILP."
        ),
        "quantum_approach": (
            "QAOA-based unit commitment for sub-problems of the grid scheduling MILP. "
            "Near-term: small regional grids. Vertex coloring for network partitioning."
        ),
        "complexity_score": 3.5,
        "horizon": "near-term",
        "featured": False,
        "featured_rank": None,
    },
    {
        "title": "Battery Material Discovery",
        "industry": IndustryTag.energy,
        "description": (
            "Identify novel cathode/anode materials with higher energy density and cycle life "
            "by simulating electron correlation in transition metal compounds."
        ),
        "quantum_approach": (
            "VQE for electronic structure of candidate materials (e.g., Li-Mn-O systems). "
            "OpenFermion for Hamiltonian construction. Long-term fault-tolerant target."
        ),
        "complexity_score": 5.0,
        "horizon": "long-term",
        "featured": True,
        "featured_rank": 1,
        "blueprint": {
            "persona": "Materials R&D lead for battery chemistry",
            "business_kpi": "Prioritize cathode or electrolyte candidates before expensive lab validation",
            "classical_baseline": "DFT / classical HPC workflow",
            "hybrid_pattern": (
                "Classical materials screen -> molecule-fragment quantum simulation starter -> "
                "classical validation against DFT and lab evidence."
            ),
            "pilot_scope_weeks": 10,
            "sample_input": "A narrowed active-space fragment for a transition metal oxide candidate.",
            "success_thresholds": [
                "Reproduce a tiny fragment benchmark with transparent assumptions",
                "Compare simulator output against DFT / HPC baseline metrics",
                "Document future-hardware upside without implying near-term production advantage",
            ],
            "next_90_days": [
                "Choose one fragment-level battery materials question with a known DFT baseline",
                "Build the molecule-fragment starter and record simulator trust metrics",
                "Write a go/no-go memo on whether a research partnership is justified",
            ],
        },
        "evidence_items": [
            {
                "title": "Quantum simulation for materials remains a research-now path",
                "publisher": "Curated seed note",
                "published_at": "2026-05-28",
                "claim": (
                    "Battery and materials workloads are credible simulator-first research candidates, "
                    "with future-hardware upside gated by active-space choices and hardware maturity."
                ),
                "source_url": "https://quantumai.google/cirq",
            }
        ],
    },
    {
        "title": "Post-Quantum Cryptography Readiness",
        "industry": IndustryTag.other,
        "description": (
            "Inventory RSA, ECC, Diffie-Hellman, ECDSA, long-lived secrets, regulated data, "
            "certificate lifetimes, and systems exposed to harvest-now-decrypt-later risk."
        ),
        "quantum_approach": (
            "Default action is PQC migration planning, crypto inventory, ownership, and memo export. "
            "Do not recommend quantum hardware or QKD as the default enterprise answer."
        ),
        "complexity_score": 2.0,
        "horizon": "near-term",
        "featured": True,
        "featured_rank": 3,
        "blueprint": {
            "persona": "Security architecture or cryptography migration owner",
            "business_kpi": "Reduce exposure to long-lived public-key cryptography risk",
            "classical_baseline": "RSA/ECC inventory status and certificate lifecycle are unknown",
            "hybrid_pattern": "Crypto inventory -> PQC migration readiness memo -> phased remediation roadmap",
            "pilot_scope_weeks": 6,
            "sample_input": "Certificate inventory, TLS endpoints, code-signing systems, regulated data retention requirements",
            "success_thresholds": [
                "Identify systems using RSA, ECC, Diffie-Hellman, or ECDSA",
                "Classify long-lived secrets and regulated data exposure",
                "Assign migration owners and next decision checkpoints",
            ],
            "next_90_days": [
                "Run a crypto asset and certificate inventory",
                "Prioritize systems by data retention sensitivity and certificate lifetime",
                "Export a PQC migration-now readiness memo for security leadership",
            ],
        },
        "evidence_items": [
            {
                "title": "NIST post-quantum cryptography standards",
                "publisher": "NIST",
                "published_at": "2024-08-13",
                "claim": (
                    "NIST finalized initial post-quantum cryptography standards, making inventory "
                    "and migration planning an action-now enterprise workflow."
                ),
                "source_url": "https://www.nist.gov/news-events/news/2024/08/nist-releases-first-3-finalized-post-quantum-encryption-standards",
            }
        ],
    },
    {
        "title": "Aerodynamic Simulation",
        "industry": IndustryTag.aerospace,
        "description": (
            "Simulate turbulent airflow over aircraft surfaces for drag reduction. "
            "Classical CFD (e.g., Navier-Stokes solvers) is compute-intensive at high fidelity."
        ),
        "quantum_approach": (
            "Quantum linear algebra (HHL algorithm) for linear systems arising in CFD discretization. "
            "Speedup is conditional on input/output via QRAM — still theoretical. Long-term horizon."
        ),
        "complexity_score": 4.5,
        "horizon": "long-term",
        "featured": False,
        "featured_rank": None,
    },
    {
        "title": "Satellite Orbit Scheduling",
        "industry": IndustryTag.aerospace,
        "description": (
            "Assign observation tasks to a constellation of satellites while managing "
            "orbital mechanics, coverage windows, and onboard storage constraints."
        ),
        "quantum_approach": (
            "Constraint satisfaction problem encoded as QUBO; solved with quantum annealing or QAOA. "
            "Near-term hybrid: quantum proposes schedules, classical validates physics."
        ),
        "complexity_score": 3.0,
        "horizon": "near-term",
        "featured": False,
        "featured_rank": None,
    },
    {
        "title": "Catalyst Design for Green Chemistry",
        "industry": IndustryTag.materials,
        "description": (
            "Discover transition metal catalysts for nitrogen fixation (Haber-Bosch replacement) "
            "with quantum-accurate energy surfaces."
        ),
        "quantum_approach": (
            "QPE for highly accurate ground-state energies of Fe-based catalyst systems. "
            "Requires thousands of logical qubits — fault-tolerant long-term goal. "
            "VQE on NISQ as exploratory mid-term step."
        ),
        "complexity_score": 5.0,
        "horizon": "long-term",
        "featured": False,
        "featured_rank": None,
    },
]


async def seed() -> None:
    async with AsyncSessionLocal() as db:
        existing = {
            row.title: row
            for row in (await db.execute(select(UseCase))).scalars().all()
        }

        inserted = 0
        updated = 0

        for payload in SEED_DATA:
            row = existing.get(payload["title"])
            blueprint = {
                **payload.get("blueprint", {}),
                **FEATURED_BLUEPRINT_EXTRAS.get(payload["title"], {}),
            }
            normalized_payload = {
                "slug": TITLE_SLUGS[payload["title"]],
                "featured": False,
                "featured_rank": None,
                "blueprint": {},
                "evidence_items": [],
                **payload,
                "blueprint": blueprint,
            }

            if row is None:
                db.add(UseCase(**normalized_payload))
                inserted += 1
                continue

            for key, value in normalized_payload.items():
                setattr(row, key, value)
            updated += 1

        await db.commit()
        print(
            f"Seed sync complete: {inserted} inserted, {updated} updated, {len(SEED_DATA)} total tracked use cases."
        )


if __name__ == "__main__":
    asyncio.run(seed())
