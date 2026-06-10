import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    hash: string;
    wallet: string;
    kind: string;
    opportunity_id?: string;
  };
  if (!body.hash) return NextResponse.json({ ok: true, skipped: "no hash" });

  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: true, skipped: "no supabase" });

  const { error } = await sb.from("transactions").upsert({
    hash: body.hash,
    wallet: body.wallet?.toLowerCase() ?? "",
    kind: body.kind,
    opportunity_id: body.opportunity_id ?? null,
  });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const oppId = url.searchParams.get("opportunity_id");
  const sb = getSupabaseAdmin();
  if (!sb || !oppId) return NextResponse.json({ items: [] });
  const { data } = await sb
    .from("transactions")
    .select("hash, kind, created_at")
    .eq("opportunity_id", oppId)
    .order("created_at", { ascending: false });
  return NextResponse.json({ items: data ?? [] });
}
