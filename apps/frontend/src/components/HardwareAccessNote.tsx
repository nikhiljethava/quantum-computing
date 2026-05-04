import { ShieldAlert } from "lucide-react";

import { HARDWARE_ACCESS_NOTE } from "@/content/use-case-pages";

export function HardwareAccessNote({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex gap-3 rounded-[22px] border border-[#fce8b2] bg-[#fef7e0] p-4 text-sm leading-7 text-[#8a4b00] ${className}`}
    >
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#f9ab00]" />
      <p>{HARDWARE_ACCESS_NOTE}</p>
    </div>
  );
}
