import { GChip } from "@/components/ui/GChip";
import type { GoogleStackItem } from "@/content/use-case-pages";

const TONES: Record<GoogleStackItem, "blue" | "green" | "yellow" | "red" | "neutral"> = {
  Cirq: "blue",
  qsim: "blue",
  OpenFermion: "green",
  "Google Colab": "yellow",
  "Vertex AI Gemini": "blue",
  "Cloud Run": "green",
  "Cloud Run Jobs": "green",
  "Cloud Storage": "yellow",
  BigQuery: "blue",
  "Cloud SQL": "blue",
  "Cloud Tasks": "green",
};

export function GoogleStackBadges({ items }: { items: GoogleStackItem[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <GChip key={item} tone={TONES[item] ?? "neutral"}>
          {item}
        </GChip>
      ))}
    </div>
  );
}
