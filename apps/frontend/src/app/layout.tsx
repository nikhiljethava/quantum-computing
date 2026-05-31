import type { Metadata } from "next";
import "./globals.css";
import { QueryProviders } from "@/components/layout/QueryProviders";
import { NavigationBar } from "@/components/layout/NavigationBar";
import { Footer } from "@/components/layout/Footer";
import { IndependentProjectNotice } from "@/components/IndependentProjectNotice";

export const metadata: Metadata = {
  title: {
    default: "Quantum Foundry — Independent Quantum Learning Lab",
    template: "%s | Quantum Foundry",
  },
  description:
    "An independent personal project for learning quantum computing, building Cirq-based simulations, exploring use cases, and mapping hybrid workflows to Google Cloud architecture patterns.",
  keywords: ["quantum computing", "Google Cloud", "QAOA", "VQE", "Cirq", "hybrid quantum"],
  openGraph: {
    title: "Quantum Foundry — Independent Quantum Learning Lab",
    description:
      "An independent personal project for learning quantum computing with Cirq-based simulations and Google Cloud architecture patterns.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body>
        <QueryProviders>
          {/* Animated star field */}
          <div className="starfield" aria-hidden="true" />

          {/* Global navigation */}
          <NavigationBar />
          <IndependentProjectNotice compact />

          {/* Page content */}
          <main style={{ position: "relative", zIndex: 1 }}>
            {children}
          </main>
          <Footer />
        </QueryProviders>
      </body>
    </html>
  );
}
