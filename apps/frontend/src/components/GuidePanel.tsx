"use client";

import { useState } from "react";
import { ArrowRight, Bot, Loader2, Send } from "lucide-react";
import Link from "next/link";

import { askGuide } from "@/lib/api";
import type { GuideAskResponse, GuidePageContext } from "@/types/api";

type GuidePanelProps = {
  pageContext: GuidePageContext;
  lessonSlug?: string;
  useCaseId?: string;
  circuitRunId?: string;
  architectureId?: string;
  starterQuestion?: string;
};

export function GuidePanel({
  pageContext,
  lessonSlug,
  useCaseId,
  circuitRunId,
  architectureId,
  starterQuestion = "What should I look at next?",
}: GuidePanelProps) {
  const [question, setQuestion] = useState(starterQuestion);
  const [response, setResponse] = useState<GuideAskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function submit() {
    if (!question.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const nextResponse = await askGuide({
        question: question.trim(),
        page_context: pageContext,
        lesson_slug: lessonSlug,
        use_case_id: useCaseId,
        circuit_run_id: circuitRunId,
        architecture_id: architectureId,
        allow_google_search_grounding: false,
      });
      setResponse(nextResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The guide could not answer yet.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-[28px] border border-[#d8e2f3] bg-white p-5 shadow-[0_18px_44px_rgba(148,163,184,0.18)]">
      <div className="mb-4 flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#e8f0fe] text-[#1967d2]">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#1967d2]">
            Ask the Guide
          </div>
          <h2 className="mt-1 text-lg font-black tracking-[-0.03em] text-slate-950">
            Quantum Foundry guide
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Local mode answers from app content and curated public references. Vertex AI Gemini can be enabled by configuration later.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void submit();
            }
          }}
          className="min-w-0 flex-1 rounded-full border border-[#d8e2f3] bg-[#f8fbff] px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#1967d2]"
          placeholder="Ask about this circuit, lesson, or use case"
        />
        <button
          type="button"
          onClick={submit}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-full bg-[#1967d2] px-4 py-3 text-sm font-semibold text-white"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Ask
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-[18px] border border-[#fad2cf] bg-[#fce8e6] px-4 py-3 text-sm text-[#c5221f]">
          {error}
        </div>
      ) : null}

      {response ? (
        <div className="mt-5 grid gap-4">
          <div className="rounded-[22px] bg-[#f8fbff] p-4 text-sm leading-7 text-slate-700">
            {response.answer}
          </div>

          {response.safety_notes.length ? (
            <div className="rounded-[18px] border border-[#fce8b2] bg-[#fef7e0] px-4 py-3 text-xs leading-6 text-[#8a4b00]">
              {response.safety_notes.join(" ")}
            </div>
          ) : null}

          {response.cited_sources.length ? (
            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Sources
              </div>
              <div className="grid gap-2">
                {response.cited_sources.map((source) => (
                  source.url ? (
                    <a
                      key={`${source.title}-${source.source_type}`}
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-[16px] border border-[#d8e2f3] bg-white px-3 py-2 text-xs font-semibold text-[#1967d2]"
                    >
                      {source.title}
                    </a>
                  ) : (
                    <div
                      key={`${source.title}-${source.source_type}`}
                      className="rounded-[16px] border border-[#d8e2f3] bg-white px-3 py-2 text-xs font-semibold text-slate-600"
                    >
                      {source.title}
                    </div>
                  )
                ))}
              </div>
            </div>
          ) : null}

          {response.recommended_next_actions.length ? (
            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Next actions
              </div>
              <div className="flex flex-wrap gap-2">
                {response.recommended_next_actions.map((action) => (
                  <Link
                    key={`${action.label}-${action.href}`}
                    href={action.href}
                    className="inline-flex items-center gap-2 rounded-full bg-[#e8f0fe] px-3 py-2 text-xs font-bold text-[#1967d2]"
                  >
                    {action.label}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
