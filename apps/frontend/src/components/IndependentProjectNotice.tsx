export const SHORT_INDEPENDENT_DISCLAIMER =
  "Independent personal project — not an official Google product.";

export const LONG_INDEPENDENT_DISCLAIMER =
  "Independent personal project. Not an official Google product. This project is not affiliated with, sponsored by, endorsed by, or maintained by Google LLC. It uses publicly available Google Cloud and Google Quantum AI ecosystem technologies where applicable.";

export function IndependentProjectNotice({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <aside
      aria-label="Independent project notice"
      className={`mx-auto max-w-[1460px] px-4 md:px-6 ${compact ? "py-3" : "py-4"}`}
    >
      <div className="rounded-[20px] border border-slate-200 bg-white/95 px-4 py-3 text-slate-800 shadow-[0_10px_30px_rgba(15,23,42,0.10)]">
        <div className="text-sm font-bold">{SHORT_INDEPENDENT_DISCLAIMER}</div>
        <details className="mt-1 text-sm leading-6 text-slate-600">
          <summary className="cursor-pointer font-semibold text-slate-700">
            Independence and attribution details
          </summary>
          <p className="pt-2">{LONG_INDEPENDENT_DISCLAIMER}</p>
        </details>
      </div>
    </aside>
  );
}
