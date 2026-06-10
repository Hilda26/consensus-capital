export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="bg-white/60 border border-dusk-blue/20 rounded-2xl p-8 text-center">
      <div className="font-display text-xl text-deep-navy">{title}</div>
      {body && <p className="mt-2 text-sm text-deep-navy/70">{body}</p>}
    </div>
  );
}
