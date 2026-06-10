import { NextResponse } from "next/server";
import { writeContract } from "@/lib/genlayer/client";
import { isContractConfigured } from "@/lib/genlayer/config";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ opportunityId: string }> }) {
  const { opportunityId } = await ctx.params;
  const body = (await req.json()) as { watching: boolean };
  if (isContractConfigured()) {
    await writeContract({
      method: "toggle_watch",
      args: [opportunityId, JSON.stringify(body)],
    });
  }
  return NextResponse.json({ ok: true });
}
