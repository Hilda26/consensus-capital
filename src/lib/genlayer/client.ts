import { CONSENSUS_CAPITAL_CONTRACT, isContractConfigured } from "./config";

type ReadArgs = { method: string; args?: unknown[] };
type WriteArgs = { method: string; args?: unknown[] };

async function importSdk() {
  try {
    return await import("genlayer-js");
  } catch {
    return null;
  }
}

export async function readContract<T = unknown>({ method, args = [] }: ReadArgs): Promise<T | null> {
  if (!isContractConfigured()) return null;
  const sdk = await importSdk();
  if (!sdk) return null;
  const anySdk = sdk as unknown as {
    createClient?: (cfg: unknown) => {
      readContract: (cfg: { address: string; method: string; args: unknown[] }) => Promise<T>;
    };
  };
  if (!anySdk.createClient) return null;
  const client = anySdk.createClient({});
  return client.readContract({ address: CONSENSUS_CAPITAL_CONTRACT, method, args });
}

export async function writeContract({ method, args = [] }: WriteArgs): Promise<string | null> {
  if (!isContractConfigured()) return null;
  const sdk = await importSdk();
  if (!sdk) return null;
  const anySdk = sdk as unknown as {
    createClient?: (cfg: unknown) => {
      writeContract: (cfg: { address: string; method: string; args: unknown[] }) => Promise<{ hash: string }>;
    };
  };
  if (!anySdk.createClient) return null;
  const client = anySdk.createClient({});
  const res = await client.writeContract({ address: CONSENSUS_CAPITAL_CONTRACT, method, args });
  return res?.hash ?? null;
}
