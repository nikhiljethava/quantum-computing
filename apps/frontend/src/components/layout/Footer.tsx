import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative z-[1] border-t border-slate-800/80 bg-[#070b16]">
      <div className="mx-auto grid max-w-[1460px] gap-4 px-4 py-6 text-sm leading-6 text-slate-400 md:px-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <p>
          Quantum Foundry is an independent personal project and is not an official Google product.
          Google, Google Cloud, GCP, Vertex AI, Gemini, Cirq, qsim, OpenFermion, and related names
          are trademarks or products of their respective owners. References are descriptive.
        </p>
        <nav aria-label="Footer navigation" className="flex flex-wrap gap-3">
          <Link className="font-semibold text-slate-200 hover:text-white" href="/about">
            About
          </Link>
          <a
            className="font-semibold text-slate-200 hover:text-white"
            href="https://github.com/nikhiljethava/quantum-computing/tree/main/docs"
            target="_blank"
            rel="noreferrer"
          >
            Documentation
          </a>
        </nav>
      </div>
    </footer>
  );
}
