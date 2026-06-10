export function ConvictionTile({ label, score }: { label: string; score: number }) {
  return (
    <div className="bg-navy-glass border border-pearl-aqua/30 rounded-lg px-3 py-3">
      <div className="text-[10px] font-data uppercase tracking-wider text-pearl-aqua/80">
        {label}
      </div>
      <div className="font-display text-2xl text-ivory-signal mt-1">{Math.round(score)}</div>
    </div>
  );
}
