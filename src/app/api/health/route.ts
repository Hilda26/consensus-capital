import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { isContractConfigured, CONSENSUS_CAPITAL_CONTRACT } from "@/lib/genlayer/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, unknown> = {
    supabase_url_set: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabase_service_role_set: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    contract_configured: isContractConfigured(),
    contract_address: CONSENSUS_CAPITAL_CONTRACT || null,
    supabase_query: "skipped",
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

  return NextResponse.json(checks);
}
