import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const wallet = (url.searchParams.get("wallet") || "").toLowerCase();
  if (!wallet) return NextResponse.json({ items: [] });

  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ items: [] });

  const { data: watch } = await sb
    .from("watchlists")
    .select("opportunity_id")
    .eq("watcher_address", wallet);

  const ids = (watch ?? []).map((r) => String(r.opportunity_id));
  if (ids.length === 0) return NextResponse.json({ items: [] });

  const { data: opps } = await sb
    .from("opportunities")
    .select("opportunity_id, title, category")
    .in("opportunity_id", ids);

  const { data: cons } = await sb
    .from("consensus_results")
    .select("opportunity_id, consensus_score, recommendation_band")
    .in("opportunity_id", ids);

  const consMap = new Map(
    (cons ?? []).map((c) => [String(c.opportunity_id), c]),
  );

  const items = (opps ?? []).map((o) => {
    const c = consMap.get(String(o.opportunity_id));
    return {
      opportunity_id: String(o.opportunity_id),
      title: String(o.title),
      category: String(o.category),
      recommendation_band: c?.recommendation_band ?? null,
      consensus_score: c?.consensus_score != null ? Number(c.consensus_score) : null,
    };
  });

  return NextResponse.json({ items });
}
