const tabs = ["Risk", "Upside", "Market Fit", "Team", "Timing", "Traction", "Moat"];

export function MemoStack() {
  return (
    <div className="relative bg-deep-navy rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-ivory-signal shadow-xl">
      <div className="text-xs font-data text-pearl-aqua tracking-wider">CAPITAL BRIEF</div>
      <div className="mt-2 font-display text-2xl">CONSENSUS LEDGER</div>
      <div className="mt-6 grid grid-cols-2 gap-2">
        {tabs.map((t) => (
          <div
            key={t}
            className="bg-navy-glass border border-pearl-aqua/30 rounded-lg px-3 py-2 text-sm flex items-center justify-between"
          >
            <span className="font-data uppercase text-pearl-aqua/80">{t}</span>
            <span className="font-data text-ivory-signal/60">--</span>
          </div>
        ))}
      </div>
      <div className="mt-6 text-xs text-ivory-signal/60">
        Scores appear after multi-model GenLayer review.
      </div>
    </div>
  );
}
