import type { RecommendationBand } from "@/types/consensus-capital";

const styles: Record<RecommendationBand, string> = {
  HIGH_CONVICTION: "bg-mint-ledger text-deep-navy",
  WATCHLIST: "bg-pearl-aqua text-deep-navy",
  SPECULATIVE: "bg-thistle text-deep-navy",
  AVOID: "bg-coral-caution text-deep-navy",
};

export function ConsensusBandBadge({ band }: { band: RecommendationBand }) {
  return (
    <span className={`font-display text-xs px-2 py-1 rounded ${styles[band]}`}>{band}</span>
  );
}
