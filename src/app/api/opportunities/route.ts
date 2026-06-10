import { NextResponse } from "next/server";
import { listSnapshots, saveSnapshot } from "@/lib/store";
import type { Opportunity, OpportunityCategory } from "@/types/consensus-capital";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const proposer = url.searchParams.get("proposer")?.toLowerCase();
    const snaps = await listSnapshots();
    const filtered = proposer
      ? snaps.filter((s) => s.opportunity.proposer_address.toLowerCase() === proposer)
      : snaps;
    return NextResponse.json({
      items: filtered.map((s) => ({
        opportunity: s.opportunity,
        consensus: s.consensus,
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { items: [], error: (err as Error).message },
      { status: 200 },
    );
  }
}

export async function POST(req: Request) {
  let body: Partial<Opportunity> & { proposer_address?: string };
  try {
    body = (await req.json()) as Partial<Opportunity> & { proposer_address?: string };
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }
  const id = `opp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const opportunity: Opportunity = {
    opportunity_id: id,
    proposer_address: body.proposer_address ?? "0x0000000000000000000000000000000000000000",
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

  let warning: string | null = null;
  try {
    await saveSnapshot({ opportunity, models: [], consensus: null, tx_hashes: [] });
  } catch (err) {
    warning = (err as Error).message;
    console.error("[POST /api/opportunities] saveSnapshot failed:", warning);
  }
  return NextResponse.json({ opportunity_id: id, warning });
}
