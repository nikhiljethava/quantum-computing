export function GCodeBlock({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto rounded-[22px] border border-[#d8e2f3] bg-[#08111f] p-4 text-sm leading-7 text-[#d7e3ff] shadow-inner">
      <code>{code}</code>
    </pre>
  );
}
