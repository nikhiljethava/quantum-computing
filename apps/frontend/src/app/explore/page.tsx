import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Explore Industry Atlas",
  description:
    "Explore featured quantum use cases with business KPIs, classical baselines, evidence, and Cirq-based simulation paths.",
  openGraph: {
    title: "Explore Industry Atlas | Quantum Foundry",
    description:
      "Featured quantum scenarios with evidence, pilot scope, Cirq labs, and Google Cloud mapping.",
  },
  alternates: {
    canonical: "/explore",
  },
};
export { default } from "./ExploreClient";
