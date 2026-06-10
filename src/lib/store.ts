import type {
  ConsensusResult,
  ModelEvaluation,
  Opportunity,
  OpportunityCategory,
  OpportunityStatus,
} from "@/types/consensus-capital";
import { getSupabaseAdmin } from "./supabase/client";
import { readContract } from "./genlayer/client";
import { validateConsensus, validateModelEvaluation } from "./validation";

export type Snapshot = {
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

function rowToOpportunity(r: Record<string, unknown>): Opportunity {
  return {
    opportunity_id: String(r.opportunity_id),
    proposer_address: String(r.proposer_address ?? ""),
    title: String(r.title ?? ""),
    category: (r.category as OpportunityCategory) ?? "OTHER",
    summary: String(r.summary ?? ""),
    market: String(r.market ?? ""),
    stage: String(r.stage ?? ""),
    team_summary: String(r.team_summary ?? ""),
    traction_summary: String(r.traction_summary ?? ""),
    thesis_text: String(r.thesis_text ?? ""),
    evidence_links: Array.isArray(r.evidence_links) ? (r.evidence_links as string[]) : [],
    amount_sought: String(r.amount_sought ?? ""),
    currency: String(r.currency ?? "USD"),
    status: (r.status as OpportunityStatus) ?? "SUBMITTED",
    created_at: String(r.created_at ?? new Date().toISOString()),
  };
}

async function fetchFromContract(opportunityId: string): Promise<Snapshot | null> {
  try {
    const oppRaw = await readContract<string>({ method: "get_opportunity", args: [opportunityId] });
    if (!oppRaw) return null;
    const oppData = JSON.parse(oppRaw) as Partial<Opportunity>;
    const opportunity: Opportunity = {
      opportunity_id: opportunityId,
      proposer_address: oppData.proposer_address ?? "",
      title: oppData.title ?? "",
      category: (oppData.category as OpportunityCategory) ?? "OTHER",
      summary: oppData.summary ?? "",
      market: oppData.market ?? "",
      stage: oppData.stage ?? "",
      team_summary: oppData.team_summary ?? "",
      traction_summary: oppData.traction_summary ?? "",
      thesis_text: oppData.thesis_text ?? "",
      evidence_links: oppData.evidence_links ?? [],
      amount_sought: oppData.amount_sought ?? "",
      currency: oppData.currency ?? "USD",
      status: (oppData.status as OpportunityStatus) ?? "SUBMITTED",
      created_at: oppData.created_at ?? new Date().toISOString(),
    };
    const modelsRaw = await readContract<string>({ method: "get_model_outputs", args: [opportunityId] });
    const consensusRaw = await readContract<string>({ method: "get_consensus_output", args: [opportunityId] });
    let models: ModelEvaluation[] = [];
    if (modelsRaw) {
      const parsed = JSON.parse(modelsRaw) as unknown[];
      models = parsed.map(validateModelEvaluation).filter((m): m is ModelEvaluation => m !== null);
    }
    let consensus: ConsensusResult | null = null;
    if (consensusRaw) consensus = validateConsensus(JSON.parse(consensusRaw));
    return { opportunity, models, consensus, tx_hashes: [] };
  } catch {
    return null;
  }
}

async function fetchFromSupabase(opportunityId: string): Promise<Snapshot | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const { data: opp } = await sb.from("opportunities").select("*").eq("opportunity_id", opportunityId).maybeSingle();
  if (!opp) return null;
  const { data: cons } = await sb.from("consensus_results").select("*").eq("opportunity_id", opportunityId).maybeSingle();
  const { data: models } = await sb.from("model_reviews").select("*").eq("opportunity_id", opportunityId);
  const consensus: ConsensusResult | null = cons
    ? {
        opportunity_id: opportunityId,
        consensus_score: Number(cons.consensus_score),
        confidence: Number(cons.confidence),
        disagreement_index: Number(cons.disagreement_index),
        recommendation_band: cons.recommendation_band,
        dimension_scores: cons.dimension_scores,
        summary: String(cons.summary ?? ""),
        strengths: cons.strengths ?? [],
        weaknesses: cons.weaknesses ?? [],
        unknowns: cons.unknowns ?? [],
        follow_up_questions: cons.follow_up_questions ?? [],
        reasoning: String(cons.reasoning ?? ""),
      }
    : null;
  return {
    opportunity: rowToOpportunity(opp),
    models: (models ?? []) as unknown as ModelEvaluation[],
    consensus,
    tx_hashes: [],
  };
}

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
  if (s.models.length > 0) {
    await sb.from("model_reviews").delete().eq("opportunity_id", s.opportunity.opportunity_id);
    await sb.from("model_reviews").insert(
      s.models.map((m) => ({
        opportunity_id: s.opportunity.opportunity_id,
        model_id: m.model_id,
        dimension_focus: m.dimension_focus,
        dimension_scores: m.dimension_scores,
        recommendation_hint: m.recommendation_hint,
        strengths: m.strengths,
        weaknesses: m.weaknesses,
        unknowns: m.unknowns,
        reasoning: m.reasoning,
        confidence: m.confidence,
      })),
    );
  }
}

export async function getSnapshot(id: string): Promise<Snapshot | null> {
  const cached = memory.get(id);
  if (cached) return cached;
  const fromSb = await fetchFromSupabase(id);
  if (fromSb) {
    memory.set(id, fromSb);
    return fromSb;
  }
  const fromChain = await fetchFromContract(id);
  if (fromChain) {
    memory.set(id, fromChain);
    return fromChain;
  }
  return null;
}

export async function listSnapshots(): Promise<Snapshot[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [...memory.values()];
  const { data } = await sb.from("opportunities").select("*").order("created_at", { ascending: false });
  if (!data) return [...memory.values()];
  const results: Snapshot[] = [];
  for (const row of data) {
    const snap = await fetchFromSupabase(String(row.opportunity_id));
    if (snap) results.push(snap);
  }
  return results;
}
