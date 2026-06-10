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
  const sb = getSupabaseAdmin();
  if (sb) {
    await sb.from("transactions").insert(body);
  }
  return NextResponse.json({ ok: true });
}
