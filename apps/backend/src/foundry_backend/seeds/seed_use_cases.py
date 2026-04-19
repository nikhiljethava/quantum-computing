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
        "featured": True,
        "featured_rank": 1,
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
        "featured": True,
        "featured_rank": 2,
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
        "featured_rank": 3,
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
        "featured": False,
        "featured_rank": None,
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
            normalized_payload = {
                "featured": False,
                "featured_rank": None,
                "blueprint": {},
                "evidence_items": [],
                **payload,
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
