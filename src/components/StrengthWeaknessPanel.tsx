export function StrengthWeaknessPanel({
  strengths,
  weaknesses,
  unknowns,
  followUps,
}: {
  strengths: string[];
  weaknesses: string[];
  unknowns: string[];
  followUps?: string[];
}) {
  const Col = ({ title, items, accent }: { title: string; items: string[]; accent: string }) => (
    <div>
      <div className={`font-data text-xs uppercase tracking-wider ${accent}`}>{title}</div>
      <ul className="mt-2 space-y-1 text-sm text-ivory-signal/90">
        {items.length === 0 ? <li className="opacity-60">--</li> : items.map((it, i) => <li key={i}>{"·"} {it}</li>)}
      </ul>
    </div>
  );

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Col title="Strengths" items={strengths} accent="text-mint-ledger" />
      <Col title="Weaknesses" items={weaknesses} accent="text-coral-caution" />
      <Col title="Unknowns" items={unknowns} accent="text-thistle" />
      {followUps && <Col title="Follow-up questions" items={followUps} accent="text-pearl-aqua" />}
    </div>
  );
}
