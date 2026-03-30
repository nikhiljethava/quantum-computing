import type { Metadata } from "next";
import "./globals.css";
import { QueryProviders } from "@/components/layout/QueryProviders";
import { NavigationBar } from "@/components/layout/NavigationBar";

export const metadata: Metadata = {
  title: {
    default: "GCP Quantum Foundry",
    template: "%s | GCP Quantum Foundry",
  },
  description:
    "An interactive quantum launchpad for PMs, architects, and technical buyers. Learn quantum concepts, explore industry use cases, simulate circuits, and map to Google Cloud.",
  keywords: ["quantum computing", "Google Cloud", "QAOA", "VQE", "Cirq", "hybrid quantum"],
  openGraph: {
    title: "GCP Quantum Foundry",
    description: "Learn, Explore, Assess, Build, and Map quantum workloads on Google Cloud.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <QueryProviders>
          {/* Animated star field */}
          <div className="starfield" aria-hidden="true" />

          {/* Global navigation */}
          <NavigationBar />

          {/* Page content */}
          <main style={{ position: "relative", zIndex: 1 }}>
            {children}
          </main>
        </QueryProviders>
      </body>
    </html>
  );
}
