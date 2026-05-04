export function GProgress({ value }: { value: number }) {
  const bounded = Math.max(0, Math.min(100, value));

  return (
    <div className="h-2 rounded-full bg-slate-100">
      <div
        className="h-2 rounded-full bg-[linear-gradient(90deg,var(--primary),var(--secondary))]"
        style={{ width: `${bounded}%` }}
      />
    </div>
  );
}
