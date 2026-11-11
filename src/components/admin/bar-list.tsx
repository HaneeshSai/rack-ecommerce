// Pure CSS horizontal bar chart (no chart library). Works in server components.
export function BarList({
  title, items, format, note,
}: { title: string; items: { label: string; value: number; hint?: string }[]; format: (n: number) => string; note?: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow)]">
      <h3 className="mb-3 font-bold">{title}</h3>
      {items.length === 0 && <p className="text-sm text-muted">No data.</p>}
      <ul className="space-y-2.5">
        {items.map((i) => (
          <li key={i.label} className="text-sm">
            <div className="mb-1 flex justify-between gap-3">
              <span className="truncate">{i.label}</span>
              <span className="shrink-0 font-semibold">{format(i.value)}{i.hint ? <span className="ml-1 text-xs font-normal text-muted">{i.hint}</span> : null}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-linear-to-r from-accent to-amber-400" style={{ width: `${Math.max(2, (i.value / max) * 100)}%` }} />
            </div>
          </li>
        ))}
      </ul>
      {note && <p className="mt-3 text-xs text-muted">{note}</p>}
    </div>
  );
}
