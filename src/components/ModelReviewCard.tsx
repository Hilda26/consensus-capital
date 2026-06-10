import type { ModelEvaluation } from "@/types/consensus-capital";
import { ConsensusBandBadge } from "./ConsensusBandBadge";

export function ModelReviewCard({ model }: { model: ModelEvaluation }) {
  return (
    <div className="bg-thistle/60 border border-dusk-blue/20 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-data uppercase text-dusk-blue">ANALYST SEAT</div>
          <div className="font-display text-deep-navy">{model.model_id}</div>
          <div className="text-xs font-data text-dusk-blue">FOCUS {model.dimension_focus}</div>
        </div>
        <ConsensusBandBadge band={model.recommendation_hint} />
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 font-data text-xs text-deep-navy">
        {Object.entries(model.dimension_scores).map(([k, v]) => (
          <div key={k} className="bg-white/60 rounded px-2 py-1">
            <div className="opacity-60 uppercase">{k}</div>
            <div className="font-display text-base">{Math.round(v as number)}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm text-deep-navy/90">{model.reasoning}</p>
      <div className="mt-2 text-xs font-data text-dusk-blue">
        confidence {model.confidence.toFixed(2)}
      </div>
    </div>
  );
}
