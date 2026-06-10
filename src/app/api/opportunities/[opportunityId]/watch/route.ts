import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ opportunityId: string }> }) {
  const { opportunityId } = await ctx.params;
  const body = (await req.json()) as { watching: boolean; wallet?: string };
  const wallet = body.wallet?.toLowerCase() || "0x0000000000000000000000000000000000000000";

  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "supabase unavailable" }, { status: 500 });

  if (body.watching) {
    const { error } = await sb
      .from("watchlists")
      .upsert({ watcher_address: wallet, opportunity_id: opportunityId });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await sb
      .from("watchlists")
      .delete()
      .eq("watcher_address", wallet)
      .eq("opportunity_id", opportunityId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, watching: body.watching });
}

export async function GET(req: Request, ctx: { params: Promise<{ opportunityId: string }> }) {
  const { opportunityId } = await ctx.params;
  const url = new URL(req.url);
  const wallet = (url.searchParams.get("wallet") || "").toLowerCase();
  if (!wallet) return NextResponse.json({ watching: false });

  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ watching: false });

  const { data } = await sb
    .from("watchlists")
    .select("opportunity_id")
    .eq("watcher_address", wallet)
    .eq("opportunity_id", opportunityId)
    .maybeSingle();

  return NextResponse.json({ watching: Boolean(data) });
}
