import { NextResponse } from "next/server";
import { saveSnapshot, getSnapshot } from "@/lib/store";
import { validateConsensus, validateModelEvaluation } from "@/lib/validation";
import { CONSENSUS_CAPITAL_CONTRACT, isContractConfigured } from "@/lib/genlayer/config";
import type { ConsensusResult, ModelEvaluation } from "@/types/consensus-capital";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

async function callRead(method: string, args: unknown[]): Promise<{ raw: unknown; error: string | null }> {
  if (!isContractConfigured()) return { raw: null, error: "contract not configured" };
  try {
    const sdk = (await import("genlayer-js")) as unknown as {
      createClient: (cfg: unknown) => {
        readContract: (cfg: { address: string; functionName: string; args: unknown[] }) => Promise<unknown>;
      };
    };
    const chains = (await import("genlayer-js/chains")) as unknown as { studionet: unknown };
    const client = sdk.createClient({ chain: chains.studionet });
    const raw = await client.readContract({
      address: CONSENSUS_CAPITAL_CONTRACT,
      functionName: method,
      args,
    });
    return { raw, error: null };
  } catch (err) {
    return { raw: null, error: (err as Error).message };
  }
}

function asString(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "bigint") return v.toString();
  if (typeof v === "object") {
    try { return JSON.stringify(v); } catch { return String(v); }
  }
  return String(v);
}

export async function POST(req: Request) {
  const { opportunity_id } = (await req.json()) as { opportunity_id: string };
  const snap = await getSnapshot(opportunity_id);
  if (!snap) return NextResponse.json({ error: "unknown opportunity" }, { status: 404 });

  const debug: Record<string, unknown> = { opportunity_id };

  const oppCall = await callRead("get_opportunity", [opportunity_id]);
  debug.opp_raw_type = typeof oppCall.raw;
  debug.opp_raw_len = asString(oppCall.raw).length;
  debug.opp_error = oppCall.error;

  const modelsCall = await callRead("get_model_outputs", [opportunity_id]);
  debug.models_raw_type = typeof modelsCall.raw;
  debug.models_raw_len = asString(modelsCall.raw).length;
  debug.models_error = modelsCall.error;

  const consensusCall = await callRead("get_consensus_output", [opportunity_id]);
  debug.consensus_raw_type = typeof consensusCall.raw;
  debug.consensus_raw_len = asString(consensusCall.raw).length;
  debug.consensus_error = consensusCall.error;

  let models: ModelEvaluation[] = snap.models;
  const modelsStr = asString(modelsCall.raw);
  if (modelsStr && modelsStr !== "[]") {
    try {
      const parsed = JSON.parse(modelsStr) as unknown[];
      models = parsed.map(validateModelEvaluation).filter((m): m is ModelEvaluation => m !== null);
      debug.models_parsed_count = models.length;
    } catch (err) {
      debug.models_parse_error = (err as Error).message;
    }
  }

  let consensus: ConsensusResult | null = snap.consensus;
  const consensusStr = asString(consensusCall.raw);
  if (consensusStr) {
    try {
      consensus = validateConsensus(JSON.parse(consensusStr));
      debug.consensus_validated = Boolean(consensus);
    } catch (err) {
      debug.consensus_parse_error = (err as Error).message;
    }
  }

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
    debug,
  });
}
