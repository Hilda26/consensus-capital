export function DisagreementMeter({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div>
      <div className="flex justify-between text-xs font-data text-ivory-signal/70">
        <span>DISAGREEMENT</span>
        <span>{value.toFixed(2)}</span>
      </div>
      <div className="h-2 rounded-full bg-navy-glass mt-1 overflow-hidden">
        <div className="h-full bg-coral-caution" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
