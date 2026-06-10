import type {
  ConsensusResult,
  DimensionScores,
  ModelEvaluation,
  RecommendationBand,
} from "@/types/consensus-capital";

const BANDS: RecommendationBand[] = [
  "HIGH_CONVICTION",
  "WATCHLIST",
  "SPECULATIVE",
  "AVOID",
];

const inRange = (n: unknown, lo: number, hi: number): boolean =>
  typeof n === "number" && Number.isFinite(n) && n >= lo && n <= hi;

const validDims = (d: unknown): d is DimensionScores => {
  if (!d || typeof d !== "object") return false;
  const o = d as Record<string, unknown>;
  return (
    inRange(o.risk, 0, 100) &&
    inRange(o.upside, 0, 100) &&
    inRange(o.market_fit, 0, 100) &&
    inRange(o.team_quality, 0, 100) &&
    inRange(o.timing, 0, 100) &&
    inRange(o.traction, 0, 100) &&
    inRange(o.moat, 0, 100)
  );
};

export function validateModelEvaluation(raw: unknown): ModelEvaluation | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (!validDims(o.dimension_scores)) return null;
  if (!BANDS.includes(o.recommendation_hint as RecommendationBand)) return null;
  if (!inRange(o.confidence, 0, 1)) return null;
  if (typeof o.reasoning !== "string" || o.reasoning.trim() === "") return null;
  if (!Array.isArray(o.strengths) || !Array.isArray(o.weaknesses) || !Array.isArray(o.unknowns)) {
    return null;
  }
  return raw as ModelEvaluation;
}

export function validateConsensus(raw: unknown): ConsensusResult | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (!inRange(o.consensus_score, 0, 100)) return null;
  if (!inRange(o.confidence, 0, 1)) return null;
  if (!inRange(o.disagreement_index, 0, 1)) return null;
  if (!BANDS.includes(o.recommendation_band as RecommendationBand)) return null;
  if (!validDims(o.dimension_scores)) return null;
  if (typeof o.reasoning !== "string" || o.reasoning.trim() === "") return null;
  if (
    !Array.isArray(o.strengths) ||
    !Array.isArray(o.weaknesses) ||
    !Array.isArray(o.unknowns) ||
    !Array.isArray(o.follow_up_questions)
  ) {
    return null;
  }
  return raw as ConsensusResult;
}
