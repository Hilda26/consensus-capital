import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { id } = (await req.json()) as { id: number };
  const sb = getSupabaseAdmin();
  if (sb) await sb.from("notifications").update({ read: true }).eq("id", id);
  return NextResponse.json({ ok: true });
}
