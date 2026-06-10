import { NextResponse } from "next/server";
import { getSnapshot, saveSnapshot } from "@/lib/store";
import { writeContract } from "@/lib/genlayer/client";
import { rerunPipeline } from "@/lib/pipeline";
import { isContractConfigured } from "@/lib/genlayer/config";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ opportunityId: string }> }) {
  const { opportunityId } = await ctx.params;
  const snap = await getSnapshot(opportunityId);
  if (!snap) return NextResponse.json({ error: "not found" }, { status: 404 });
  const body = (await req.json()) as { note: string; evidence_links?: string[] };

  if (isContractConfigured()) {
    const updateId = `upd_${Date.now().toString(36)}`;
    await writeContract({
      method: "submit_follow_up_update",
      args: [opportunityId, updateId, JSON.stringify(body)],
    });
  }

  const next = await rerunPipeline({ ...snap.opportunity, status: "UPDATED" });
  await saveSnapshot(next);
  return NextResponse.json({ ok: true });
}
