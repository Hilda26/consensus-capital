export function DashboardStats({ stats }: { stats: { label: string; value: string | number }[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="bg-white/70 border border-dusk-blue/20 rounded-2xl p-4">
          <div className="text-[10px] font-data uppercase text-dusk-blue">{s.label}</div>
          <div className="font-display text-2xl text-deep-navy">{s.value}</div>
        </div>
      ))}
    </div>
  );
}
