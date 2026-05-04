import type { MaturityLabel } from "@/content/use-case-pages";

const LABELS: Record<MaturityLabel, string> = {
  learn_now: "Learn now",
  simulate_now: "Simulate now",
  pilot_carefully: "Pilot carefully",
  research_only: "Research only",
  future_fault_tolerant_required: "Future fault-tolerant required",
  approved_hardware_access_only: "Approved hardware access only",
};

const TONES: Record<MaturityLabel, string> = {
  learn_now: "bg-[#e8f0fe] text-[#1967d2] border-[#c6dafc]",
  simulate_now: "bg-[#e6f4ea] text-[#137333] border-[#c4e8cf]",
  pilot_carefully: "bg-[#fef7e0] text-[#b06000] border-[#fce8b2]",
  research_only: "bg-[#f3e8fd] text-[#8430ce] border-[#e9d2fd]",
  future_fault_tolerant_required: "bg-[#fce8e6] text-[#c5221f] border-[#fad2cf]",
  approved_hardware_access_only: "bg-[#fff7ed] text-[#c2410c] border-[#fed7aa]",
};

export function GMaturityBadge({ label }: { label: MaturityLabel }) {
  return (
    <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold ${TONES[label]}`}>
      {LABELS[label]}
    </span>
  );
}
