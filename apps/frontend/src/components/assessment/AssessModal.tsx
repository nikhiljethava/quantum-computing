"use client";

import Link from "next/link";
import { ArrowRight, ClipboardCheck, X } from "lucide-react";

import type { UseCase } from "@/types/api";

export function AssessModal({
  useCase,
  onClose,
}: {
  useCase: UseCase;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-labelledby="assessment-dialog-title">
      <button
        type="button"
        aria-label="Close assessment dialog"
        onClick={onClose}
        className="absolute inset-0 h-full w-full bg-black/70"
      />
      <section className="absolute bottom-0 right-0 top-0 w-full max-w-[520px] overflow-y-auto border-l border-slate-700 bg-[#0b1220] p-6 text-white shadow-2xl md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 border border-[#475569] bg-[#111827] px-3 py-2 text-xs font-bold uppercase text-[#93c5fd]">
              <ClipboardCheck className="h-4 w-4" />
              QALS 3.0 readiness assessment
            </div>
            <h2 id="assessment-dialog-title" className="mt-5 text-2xl font-black">
              Assess {useCase.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center border border-slate-600 text-slate-300 transition hover:border-white hover:text-white"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        <p className="mt-6 text-sm leading-7 text-slate-300">
          The full guided intake keeps the problem statement, declared classical baseline,
          baseline metrics, contract inputs, evidence, assumptions, and time horizon together.
          QALS 3.0 is deterministic and evidence-backed; it is not an ML advantage predictor.
        </p>

        <div className="mt-6 grid gap-3 border border-slate-700 bg-[#111827] p-5 text-sm leading-7 text-slate-300">
          <div>Use case: <strong className="text-white">{useCase.title}</strong></div>
          <div>Industry: <strong className="capitalize text-white">{useCase.industry}</strong></div>
          <div>Current horizon: <strong className="capitalize text-white">{useCase.horizon}</strong></div>
        </div>

        <div className="mt-8 border-l-2 border-[#f59e0b] pl-4 text-sm leading-7 text-slate-300">
          Classical baseline required for confident compute recommendations. Missing baseline data
          caps readiness and restricts serious Build eligibility.
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href={`/assess?use_case_id=${useCase.id}`}
            className="inline-flex items-center justify-center gap-2 bg-[#2563eb] px-5 py-3 text-sm font-bold text-white"
          >
            Open guided assessment
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="border border-slate-600 px-5 py-3 text-sm font-bold text-slate-300 transition hover:border-white hover:text-white"
          >
            Keep exploring
          </button>
        </div>
      </section>
    </div>
  );
}
