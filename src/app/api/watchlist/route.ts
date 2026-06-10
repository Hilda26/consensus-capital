import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const wallet = url.searchParams.get("wallet");
  if (!wallet) return NextResponse.json({ items: [] });
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ items: [] });
  const { data } = await sb.from("watchlists").select("*").eq("watcher_address", wallet);
  return NextResponse.json({ items: data ?? [] });
}
