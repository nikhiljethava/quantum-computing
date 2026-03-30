"""
Seed script — populates use_cases table with curated industry examples.

Run this after `alembic upgrade head`:
    cd apps/backend
    python -m foundry_backend.seeds.seed_use_cases

Data is static and version-controlled. Do NOT auto-run this on every deploy.
"""

import asyncio
import sys
from pathlib import Path

# Make src importable when run directly
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "src"))

from foundry_backend.db.session import AsyncSessionLocal
from foundry_backend.models.models import IndustryTag, UseCase

SEED_DATA: list[dict] = [
    # -----------------------------------------------------------------------
    # Finance
    # -----------------------------------------------------------------------
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
    },
    # -----------------------------------------------------------------------
    # Pharma / Life Sciences
    # -----------------------------------------------------------------------
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
    },
    # -----------------------------------------------------------------------
    # Logistics
    # -----------------------------------------------------------------------
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
    },
    # -----------------------------------------------------------------------
    # Energy
    # -----------------------------------------------------------------------
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
    },
    # -----------------------------------------------------------------------
    # Aerospace
    # -----------------------------------------------------------------------
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
    },
    # -----------------------------------------------------------------------
    # Materials
    # -----------------------------------------------------------------------
    {
        "title": "Catalyst Design for Green Chemistry",
        "industry": IndustryTag.materials,
        "description": (
            "Discover transition metal catalysts for nitrogen fixation (Haber–Bosch replacement) "
            "with quantum-accurate energy surfaces."
        ),
        "quantum_approach": (
            "QPE for highly accurate ground-state energies of Fe-based catalyst systems. "
            "Requires thousands of logical qubits — fault-tolerant long-term goal. "
            "VQE on NISQ as exploratory mid-term step."
        ),
        "complexity_score": 5.0,
        "horizon": "long-term",
    },
]


async def seed() -> None:
    async with AsyncSessionLocal() as db:
        # Detect existing records to make seeding idempotent
        from sqlalchemy import select, func
        from foundry_backend.models.models import UseCase

        count = (await db.execute(select(func.count()).select_from(UseCase))).scalar_one()
        if count > 0:
            print(f"Seed skipped: {count} use_cases already exist. Delete them first to re-seed.")
            return

        records = [UseCase(**row) for row in SEED_DATA]
        db.add_all(records)
        await db.commit()
        print(f"Seeded {len(records)} use cases.")


if __name__ == "__main__":
    asyncio.run(seed())
