import Link from "next/link";
import type { Opportunity, ConsensusResult } from "@/types/consensus-capital";
import { ConsensusBandBadge } from "./ConsensusBandBadge";

export function OpportunityCard({
  opportunity,
  consensus,
}: {
  opportunity: Opportunity;
  consensus?: ConsensusResult | null;
}) {
  return (
    <div className="relative bg-white/70 border border-dusk-blue/20 rounded-2xl p-5 flex gap-4">
      <div className="flex-1">
        <div className="text-[10px] font-data uppercase tracking-wider text-dusk-blue">
          {opportunity.category}
        </div>
        <h3 className="font-display text-lg text-deep-navy mt-1">{opportunity.title}</h3>
        <div className="text-xs text-deep-navy/70 mt-1 font-data">
          {opportunity.market || "--"} {"·"} {opportunity.stage || "--"}
        </div>
        <div className="mt-3 flex items-center gap-3">
          {consensus ? (
            <>
              <div className="bg-deep-navy text-ivory-signal font-data px-2 py-1 rounded">
                {Math.round(consensus.consensus_score)}
              </div>
              <ConsensusBandBadge band={consensus.recommendation_band} />
              <div className="text-xs text-dusk-blue font-data">
                conf {consensus.confidence.toFixed(2)} {"·"} dis {consensus.disagreement_index.toFixed(2)}
              </div>
            </>
          ) : (
            <div className="text-xs font-data text-dusk-blue">Not reviewed</div>
          )}
        </div>
      </div>
      <Link
        href={`/opportunity/${opportunity.opportunity_id}`}
        className="self-stretch flex items-center bg-pearl-aqua text-deep-navy font-display px-3 rounded-l-2xl"
      >
        Open Brief
      </Link>
    </div>
  );
}
