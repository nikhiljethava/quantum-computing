"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Atom,
  ArrowRight,
  Zap,
  Globe,
  FlaskConical,
  Map,
  BookOpen,
  Layers,
} from "lucide-react";

// ── Concept cards ──────────────────────────────────────────────────────────

const CONCEPTS = [
  {
    icon: "🌊",
    title: "Superposition",
    tagline: "Being in multiple states at once",
    description:
      "A qubit exists as 0 and 1 simultaneously until measured. This parallelism lets quantum computers explore solutions simultaneously rather than one at a time.",
    circuit: "Coin Flip",
    href: "/build?circuit=coin_flip",
  },
  {
    icon: "🔗",
    title: "Entanglement",
    tagline: "Quantum correlation at any distance",
    description:
      "Entangled qubits are correlated: measuring one instantly determines the other. Einstein called it 'spooky action at a distance.' It's the backbone of quantum communication.",
    circuit: "Bell State",
    href: "/build?circuit=bell_state",
  },
  {
    icon: "📡",
    title: "Interference",
    tagline: "Amplifying right answers, cancelling wrong ones",
    description:
      "Quantum algorithms use constructive interference to boost the probability of correct answers and destructive interference to suppress incorrect ones.",
    circuit: "Grover Search",
    href: "/build?circuit=grover",
  },
  {
    icon: "🧮",
    title: "Amplitude Amplification",
    tagline: "Finding needles in quantum haystacks",
    description:
      "Grover's algorithm exploits amplitude amplification to search N items in √N steps — a quadratic speedup over exhaustive classical search.",
    circuit: "Grover Search",
    href: "/build?circuit=grover",
  },
];

// ── Journey steps ──────────────────────────────────────────────────────────

const JOURNEY = [
  { step: "01", icon: BookOpen, label: "Learn", desc: "Grasp the core quantum concepts", href: "/", active: true },
  { step: "02", icon: Globe, label: "Explore", desc: "Discover industry use cases", href: "/explore" },
  { step: "03", icon: FlaskConical, label: "Build", desc: "Simulate real quantum circuits", href: "/build" },
  { step: "04", icon: Map, label: "Map", desc: "Visualize your GCP architecture", href: "/map" },
];

// ── Page ───────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "6rem 1.5rem 4rem",
          textAlign: "center",
          position: "relative",
        }}
      >
        {/* Glow orb */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "600px",
            height: "600px",
            background:
              "radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.375rem 1rem",
              borderRadius: "9999px",
              border: "1px solid rgba(99,102,241,0.3)",
              background: "rgba(99,102,241,0.08)",
              marginBottom: "2rem",
              fontSize: "0.8rem",
              color: "var(--color-glow-accent)",
              fontWeight: 600,
            }}
          >
            <Atom size={13} />
            GCP Quantum Foundry · Simulation Mode
          </div>

          <h1
            style={{
              fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
              fontWeight: 900,
              marginBottom: "1.5rem",
              lineHeight: 1.05,
            }}
          >
            Quantum Computing,{" "}
            <span className="gradient-text">Demystified</span>
          </h1>

          <p
            style={{
              fontSize: "clamp(1rem, 2vw, 1.25rem)",
              color: "var(--color-text-secondary)",
              maxWidth: "640px",
              margin: "0 auto 2.5rem",
              lineHeight: 1.7,
            }}
          >
            An interactive launchpad for PMs, architects, and technical buyers.
            Learn core concepts, explore real industry applications, simulate
            quantum circuits, and map your workload to Google Cloud.
          </p>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/explore" className="btn-primary" style={{ fontSize: "1rem", padding: "0.75rem 1.75rem" }}>
              Explore Use Cases <ArrowRight size={16} />
            </Link>
            <Link href="/build" className="btn-ghost" style={{ fontSize: "1rem", padding: "0.75rem 1.75rem" }}>
              <Zap size={16} /> Run a Circuit
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Journey steps ────────────────────────────────────────────────── */}
      <section
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 1.5rem 5rem",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1rem",
          }}
        >
          {JOURNEY.map(({ step, icon: Icon, label, desc, href, active }, i) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <Link href={href} style={{ textDecoration: "none" }}>
                <div
                  className="glass"
                  style={{
                    padding: "1.5rem",
                    cursor: "pointer",
                    transition: "transform 0.2s, border-color 0.2s",
                    borderColor: active ? "rgba(99,102,241,0.45)" : undefined,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        background: active
                          ? "linear-gradient(135deg, #6366f1, #2dd4bf)"
                          : "rgba(99,102,241,0.12)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={17} color={active ? "#fff" : "var(--color-glow-primary)"} />
                    </div>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        color: "var(--color-text-muted)",
                        letterSpacing: "0.1em",
                      }}
                    >
                      STEP {step}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>{label}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>{desc}</div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Concept cards ────────────────────────────────────────────────── */}
      <section
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 1.5rem 6rem",
        }}
      >
        <div style={{ marginBottom: "2.5rem" }}>
          <div
            className="chip"
            style={{
              background: "rgba(167,139,250,0.1)",
              color: "var(--color-glow-accent)",
              border: "1px solid rgba(167,139,250,0.25)",
              marginBottom: "1rem",
            }}
          >
            <Layers size={11} /> Core Concepts
          </div>
          <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", marginBottom: "0.5rem" }}>
            The Four Pillars of Quantum
          </h2>
          <p style={{ color: "var(--color-text-secondary)", maxWidth: "500px" }}>
            Every quantum algorithm is built from these four primitives. Click any card to
            simulate the corresponding circuit.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {CONCEPTS.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Link href={c.href} style={{ textDecoration: "none", display: "block", height: "100%" }}>
                <div
                  className="glass"
                  style={{
                    padding: "1.75rem",
                    height: "100%",
                    transition: "transform 0.2s, border-color 0.2s, box-shadow 0.2s",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.transform = "translateY(-4px)";
                    el.style.borderColor = "rgba(99,102,241,0.5)";
                    el.style.boxShadow = "0 8px 40px rgba(99,102,241,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.transform = "translateY(0)";
                    el.style.borderColor = "";
                    el.style.boxShadow = "";
                  }}
                >
                  <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>{c.icon}</div>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      color: "var(--color-glow-secondary)",
                      letterSpacing: "0.08em",
                      marginBottom: "0.375rem",
                      textTransform: "uppercase",
                    }}
                  >
                    {c.tagline}
                  </div>
                  <h3 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>{c.title}</h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", lineHeight: 1.65, marginBottom: "1.25rem" }}>
                    {c.description}
                  </p>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.375rem",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--color-glow-primary)",
                    }}
                  >
                    <Zap size={12} /> Simulate: {c.circuit} <ArrowRight size={12} />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
