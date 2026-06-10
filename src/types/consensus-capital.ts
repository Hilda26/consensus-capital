export type OpportunityCategory =
  | "STARTUP_EQUITY"
  | "TOKEN_OR_PROTOCOL"
  | "TREASURY_ALLOCATION"
  | "ACQUISITION_THESIS"
  | "PARTNERSHIP_THESIS"
  | "COMMUNITY_FUND_PROPOSAL"
  | "MARKET_ENTRY_THESIS"
  | "PUBLIC_GOOD_FUNDING"
  | "EXPERIMENTAL_SPECULATIVE"
  | "OTHER";

export type RecommendationBand =
  | "HIGH_CONVICTION"
  | "WATCHLIST"
  | "SPECULATIVE"
  | "AVOID";

export type OpportunityStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "REVIEWED"
  | "UPDATED"
  | "ARCHIVED";

export interface DimensionScores {
  risk: number;
  upside: number;
  market_fit: number;
  team_quality: number;
  timing: number;
  traction: number;
  moat: number;
}

export interface Opportunity {
  opportunity_id: string;
  proposer_address: string;
  title: string;
  category: OpportunityCategory;
  summary: string;
  market: string;
  stage: string;
  team_summary: string;
  traction_summary: string;
  thesis_text: string;
  evidence_links: string[];
  amount_sought: string;
  currency: string;
  status: OpportunityStatus;
  created_at: string;
}

export interface ModelEvaluation {
  model_id: string;
  dimension_focus: keyof DimensionScores | "GENERAL";
  dimension_scores: DimensionScores;
  recommendation_hint: RecommendationBand;
  strengths: string[];
  weaknesses: string[];
  unknowns: string[];
  reasoning: string;
  confidence: number;
}

export interface ConsensusResult {
  opportunity_id: string;
  consensus_score: number;
  confidence: number;
  disagreement_index: number;
  recommendation_band: RecommendationBand;
  dimension_scores: DimensionScores;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  unknowns: string[];
  follow_up_questions: string[];
  reasoning: string;
}

export interface OpportunityUpdate {
  update_id: string;
  opportunity_id: string;
  note: string;
  evidence_links: string[];
  created_at: string;
}

export interface WatchState {
  opportunity_id: string;
  watcher_address: string;
  watching: boolean;
  updated_at: string;
}
