export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="bg-white/60 border border-dusk-blue/20 rounded-2xl p-6 text-center font-data text-deep-navy/70">
      {label}...
    </div>
  );
}
