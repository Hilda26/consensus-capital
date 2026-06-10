import type {
  ConsensusResult,
  ModelEvaluation,
  Opportunity,
} from "@/types/consensus-capital";
import { isContractConfigured } from "./genlayer/config";
import { readContract, writeContract } from "./genlayer/client";
import { validateConsensus, validateModelEvaluation } from "./validation";

type Snapshot = {
  opportunity: Opportunity;
  models: ModelEvaluation[];
  consensus: ConsensusResult | null;
  tx_hashes: string[];
};

export async function runConsensusPipeline(opp: Opportunity): Promise<Snapshot> {
  if (!isContractConfigured()) {
    return { opportunity: opp, models: [], consensus: null, tx_hashes: [] };
  }

  const txHashes: string[] = [];
  try {
    const hash = await writeContract({
      method: "create_opportunity",
      args: [opp.opportunity_id, JSON.stringify(opp)],
    });
    if (hash) txHashes.push(hash);

    const modelsRaw = await readContract<string>({
      method: "get_model_outputs",
      args: [opp.opportunity_id],
    });
    const consensusRaw = await readContract<string>({
      method: "get_consensus_output",
      args: [opp.opportunity_id],
    });

    let models: ModelEvaluation[] = [];
    if (modelsRaw) {
      const parsed = JSON.parse(modelsRaw) as unknown[];
      models = parsed
        .map(validateModelEvaluation)
        .filter((m): m is ModelEvaluation => m !== null);
    }

    let consensus: ConsensusResult | null = null;
    if (consensusRaw) {
      consensus = validateConsensus(JSON.parse(consensusRaw));
    }

    return {
      opportunity: { ...opp, status: consensus ? "REVIEWED" : "UNDER_REVIEW" },
      models,
      consensus,
      tx_hashes: txHashes,
    };
  } catch {
    return { opportunity: opp, models: [], consensus: null, tx_hashes: txHashes };
  }
}

export async function rerunPipeline(opp: Opportunity): Promise<Snapshot> {
  if (!isContractConfigured()) {
    return { opportunity: opp, models: [], consensus: null, tx_hashes: [] };
  }
  const txHashes: string[] = [];
  try {
    const hash = await writeContract({
      method: "rerun_consensus",
      args: [opp.opportunity_id],
    });
    if (hash) txHashes.push(hash);
  } catch {
    // ignore - pipeline will reflect empty result
  }
  return runConsensusPipeline(opp);
}
