import { NextResponse } from "next/server";
import { readContract } from "@/lib/genlayer/client";
import { saveSnapshot, getSnapshot } from "@/lib/store";
import { validateConsensus, validateModelEvaluation } from "@/lib/validation";
import type { ConsensusResult, ModelEvaluation } from "@/types/consensus-capital";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: Request) {
  const { opportunity_id } = (await req.json()) as { opportunity_id: string };
  const snap = await getSnapshot(opportunity_id);
  if (!snap) return NextResponse.json({ error: "unknown opportunity" }, { status: 404 });

  try {
    const modelsRaw = await readContract<string>({ method: "get_model_outputs", args: [opportunity_id] });
    const consensusRaw = await readContract<string>({ method: "get_consensus_output", args: [opportunity_id] });

    let models: ModelEvaluation[] = snap.models;
    if (modelsRaw) {
      const parsed = JSON.parse(modelsRaw) as unknown[];
      models = parsed.map(validateModelEvaluation).filter((m): m is ModelEvaluation => m !== null);
    }
    let consensus: ConsensusResult | null = snap.consensus;
    if (consensusRaw) consensus = validateConsensus(JSON.parse(consensusRaw));

    if (consensus || models.length !== snap.models.length) {
      await saveSnapshot({
        ...snap,
        opportunity: { ...snap.opportunity, status: consensus ? "REVIEWED" : snap.opportunity.status },
        models,
        consensus,
      });
    }
    return NextResponse.json({
      ok: true,
      has_consensus: Boolean(consensus),
      model_count: models.length,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message, has_consensus: false },
      { status: 200 },
    );
  }
}
