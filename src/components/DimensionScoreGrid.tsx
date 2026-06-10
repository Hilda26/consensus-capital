import type { DimensionScores } from "@/types/consensus-capital";
import { ConvictionTile } from "./ConvictionTile";

const ORDER: (keyof DimensionScores)[] = [
  "risk", "upside", "market_fit", "team_quality", "timing", "traction", "moat",
];

export function DimensionScoreGrid({ scores }: { scores: DimensionScores }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {ORDER.map((k) => (
        <ConvictionTile key={k} label={k.replace("_", " ")} score={scores[k]} />
      ))}
    </div>
  );
}
