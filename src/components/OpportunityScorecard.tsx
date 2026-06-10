import type { ConsensusResult } from "@/types/consensus-capital";
import { ConsensusLedger } from "./ConsensusLedger";

export function OpportunityScorecard({ consensus }: { consensus: ConsensusResult | null }) {
  if (!consensus) {
    return (
      <div className="bg-white/60 border border-dusk-blue/20 rounded-2xl p-6 text-deep-navy/70">
        This opportunity has not been reviewed by GenLayer consensus yet.
      </div>
    );
  }
  return <ConsensusLedger consensus={consensus} />;
}
