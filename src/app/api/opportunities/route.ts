import { NextResponse } from "next/server";
import { listSnapshots, saveSnapshot } from "@/lib/store";
import { runConsensusPipeline } from "@/lib/pipeline";
import type { Opportunity, OpportunityCategory } from "@/types/consensus-capital";

export const dynamic = "force-dynamic";

export async function GET() {
  const snaps = await listSnapshots();
  return NextResponse.json({ items: snaps.map((s) => s.opportunity) });
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<Opportunity>;
  if (!body.title || typeof body.title !== "string") {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }
  const id = `opp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const opportunity: Opportunity = {
    opportunity_id: id,
    proposer_address: "0x0000000000000000000000000000000000000000",
    title: body.title,
    category: (body.category as OpportunityCategory) ?? "OTHER",
    summary: body.summary ?? "",
    market: body.market ?? "",
    stage: body.stage ?? "",
    team_summary: body.team_summary ?? "",
    traction_summary: body.traction_summary ?? "",
    thesis_text: body.thesis_text ?? "",
    evidence_links: Array.isArray(body.evidence_links) ? body.evidence_links : [],
    amount_sought: body.amount_sought ?? "",
    currency: body.currency ?? "USD",
    status: "SUBMITTED",
    created_at: new Date().toISOString(),
  };

  const result = await runConsensusPipeline(opportunity);
  await saveSnapshot(result);
  return NextResponse.json({ opportunity_id: id });
}
