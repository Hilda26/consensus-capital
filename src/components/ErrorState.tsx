export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="bg-white/60 border border-coral-caution rounded-2xl p-6 text-center">
      <div className="font-display text-deep-navy">Something went wrong</div>
      <p className="mt-2 text-sm text-deep-navy/70">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 signal-tab border border-coral-caution text-coral-caution px-4 py-2 font-display text-sm"
        >
          RETRY
        </button>
      )}
    </div>
  );
}
