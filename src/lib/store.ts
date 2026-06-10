import type { ConsensusResult, ModelEvaluation, Opportunity } from "@/types/consensus-capital";
import { getSupabaseAdmin } from "./supabase/client";

type Snapshot = {
  opportunity: Opportunity;
  models: ModelEvaluation[];
  consensus: ConsensusResult | null;
  tx_hashes: string[];
};

declare global {
  // eslint-disable-next-line no-var
  var __cc_store: Map<string, Snapshot> | undefined;
}

const memory: Map<string, Snapshot> = globalThis.__cc_store ?? new Map();
globalThis.__cc_store = memory;

export async function saveSnapshot(s: Snapshot): Promise<void> {
  memory.set(s.opportunity.opportunity_id, s);
  const sb = getSupabaseAdmin();
  if (!sb) return;
  await sb.from("opportunities").upsert({
    opportunity_id: s.opportunity.opportunity_id,
    proposer_address: s.opportunity.proposer_address,
    title: s.opportunity.title,
    category: s.opportunity.category,
    summary: s.opportunity.summary,
    market: s.opportunity.market,
    stage: s.opportunity.stage,
    team_summary: s.opportunity.team_summary,
    traction_summary: s.opportunity.traction_summary,
    thesis_text: s.opportunity.thesis_text,
    evidence_links: s.opportunity.evidence_links,
    amount_sought: s.opportunity.amount_sought,
    currency: s.opportunity.currency,
    status: s.opportunity.status,
  });
  if (s.consensus) {
    await sb.from("consensus_results").upsert({
      opportunity_id: s.consensus.opportunity_id,
      consensus_score: s.consensus.consensus_score,
      confidence: s.consensus.confidence,
      disagreement_index: s.consensus.disagreement_index,
      recommendation_band: s.consensus.recommendation_band,
      dimension_scores: s.consensus.dimension_scores,
      summary: s.consensus.summary,
      strengths: s.consensus.strengths,
      weaknesses: s.consensus.weaknesses,
      unknowns: s.consensus.unknowns,
      follow_up_questions: s.consensus.follow_up_questions,
      reasoning: s.consensus.reasoning,
    });
  }
}

export async function getSnapshot(id: string): Promise<Snapshot | null> {
  return memory.get(id) ?? null;
}

export async function listSnapshots(): Promise<Snapshot[]> {
  return [...memory.values()].sort((a, b) =>
    a.opportunity.created_at < b.opportunity.created_at ? 1 : -1
  );
}
