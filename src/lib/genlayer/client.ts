import { CONSENSUS_CAPITAL_CONTRACT, isContractConfigured } from "./config";

type ReadArgs = { method: string; args?: unknown[] };

type GLClient = {
  readContract: (cfg: {
    address: string;
    functionName: string;
    args?: unknown[];
  }) => Promise<unknown>;
  writeContract: (cfg: {
    address: string;
    functionName: string;
    args?: unknown[];
    value: bigint;
  }) => Promise<unknown>;
};

async function getReadClient(): Promise<GLClient | null> {
  if (!isContractConfigured()) return null;
  try {
    const sdk = await import("genlayer-js");
    const chains = await import("genlayer-js/chains");
    const studionet = (chains as unknown as { studionet: unknown }).studionet;
    const createClient = (sdk as unknown as { createClient: (cfg: unknown) => GLClient }).createClient;
    return createClient({ chain: studionet });
  } catch {
    return null;
  }
}

export async function readContract<T = unknown>({ method, args = [] }: ReadArgs): Promise<T | null> {
  const client = await getReadClient();
  if (!client) return null;
  try {
    const res = await client.readContract({
      address: CONSENSUS_CAPITAL_CONTRACT,
      functionName: method,
      args,
    });
    if (res == null) return null;
    if (typeof res === "string") return res as T;
    return res as T;
  } catch {
    return null;
  }
}

export async function writeContract(_args?: {
  method: string;
  args?: unknown[];
}): Promise<string | null> {
  void _args;
  return null;
}
