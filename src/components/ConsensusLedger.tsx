import type { ConsensusResult } from "@/types/consensus-capital";
import { ConsensusBandBadge } from "./ConsensusBandBadge";
import { DimensionScoreGrid } from "./DimensionScoreGrid";
import { DisagreementMeter } from "./DisagreementMeter";
import { StrengthWeaknessPanel } from "./StrengthWeaknessPanel";

export function ConsensusLedger({ consensus }: { consensus: ConsensusResult }) {
  return (
    <section className="bg-deep-navy text-ivory-signal rounded-2xl sm:rounded-3xl p-5 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4 sm:gap-6">
        <div>
          <div className="text-[10px] sm:text-xs font-data text-pearl-aqua tracking-wider">CONSENSUS LEDGER</div>
          <div className="font-display text-5xl sm:text-6xl">{Math.round(consensus.consensus_score)}</div>
          <div className="font-data text-xs text-ivory-signal/70">CONSENSUS SCORE</div>
        </div>
        <div className="flex flex-col gap-3 w-full sm:w-auto sm:min-w-[14rem]">
          <ConsensusBandBadge band={consensus.recommendation_band} />
          <div className="text-xs font-data text-ivory-signal/70">
            CONFIDENCE {consensus.confidence.toFixed(2)}
          </div>
          <DisagreementMeter value={consensus.disagreement_index} />
        </div>
      </div>

      <div className="mt-6 sm:mt-8">
        <DimensionScoreGrid scores={consensus.dimension_scores} />
      </div>

      <div className="mt-6 sm:mt-8 text-sm text-ivory-signal/90">
        <p>{consensus.summary}</p>
      </div>

      <div className="mt-6 sm:mt-8">
        <StrengthWeaknessPanel
          strengths={consensus.strengths}
          weaknesses={consensus.weaknesses}
          unknowns={consensus.unknowns}
          followUps={consensus.follow_up_questions}
        />
      </div>

      <div className="mt-6 sm:mt-8 border-t border-pearl-aqua/20 pt-4">
        <div className="font-data text-xs text-pearl-aqua">REASONING</div>
        <p className="mt-2 text-sm text-ivory-signal/90 whitespace-pre-wrap">{consensus.reasoning}</p>
      </div>
    </section>
  );
}
