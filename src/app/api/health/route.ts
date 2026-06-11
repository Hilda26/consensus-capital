import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { isContractConfigured, CONSENSUS_CAPITAL_CONTRACT } from "@/lib/genlayer/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, unknown> = {
    supabase_url_set: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabase_service_role_set: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    operator_key_set: Boolean(process.env.GENLAYER_OPERATOR_PRIVATE_KEY),
    contract_configured: isContractConfigured(),
    contract_address: CONSENSUS_CAPITAL_CONTRACT || null,
    supabase_query: "skipped",
    contract_read_total: "skipped",
    contract_read_error: null as string | null,
    contract_read_raw_type: null as string | null,
    contract_read_raw_value: null as unknown,
  };

  const sb = getSupabaseAdmin();
  if (sb) {
    try {
      const { error } = await sb.from("opportunities").select("opportunity_id").limit(1);
      checks.supabase_query = error ? `error: ${error.message}` : "ok";
    } catch (err) {
      checks.supabase_query = `threw: ${(err as Error).message}`;
    }
  }

  if (isContractConfigured()) {
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
        functionName: "get_total_opportunities",
        args: [],
      });
      checks.contract_read_total = "ok";
      checks.contract_read_raw_type = typeof raw;
      checks.contract_read_raw_value =
        typeof raw === "bigint" ? raw.toString() : (raw as unknown);
    } catch (err) {
      checks.contract_read_error = (err as Error).message;
    }
  }

  return NextResponse.json(checks);
}
