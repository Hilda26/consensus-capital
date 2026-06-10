import { NextResponse } from "next/server";
import { getSnapshot } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ opportunityId: string }> }) {
  const { opportunityId } = await ctx.params;
  const snap = await getSnapshot(opportunityId);
  if (!snap) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ consensus: snap.consensus, models: snap.models });
}
