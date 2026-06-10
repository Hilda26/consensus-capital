import { NextResponse } from "next/server";
import { getSnapshot, saveSnapshot } from "@/lib/store";
import { CONSENSUS_CAPITAL_CONTRACT, isContractConfigured } from "@/lib/genlayer/config";
import { getSupabaseAdmin } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type GLClient = {
  writeContract: (cfg: {
    address: string;
    functionName: string;
    args: unknown[];
  }) => Promise<{ hash?: string } | string>;
};

type GLSdk = {
  createClient?: (cfg: unknown) => GLClient;
  createAccount?: (pk: string) => unknown;
  chains?: Record<string, unknown>;
};

async function loadSdk(): Promise<GLSdk | null> {
  try {
    return (await import("genlayer-js")) as unknown as GLSdk;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  if (!isContractConfigured()) {
    return NextResponse.json({ error: "contract not configured" }, { status: 500 });
  }
  const pk = process.env.GENLAYER_OPERATOR_PRIVATE_KEY;
  if (!pk) {
    return NextResponse.json(
      {
        error:
          "GENLAYER_OPERATOR_PRIVATE_KEY not set. Add a funded Studionet private key to Vercel env vars.",
      },
      { status: 500 },
    );
  }

  const { opportunity_id } = (await req.json()) as { opportunity_id: string };
  const snap = await getSnapshot(opportunity_id);
  if (!snap) return NextResponse.json({ error: "opportunity not found" }, { status: 404 });

  const sdk = await loadSdk();
  if (!sdk?.createClient || !sdk?.createAccount) {
    return NextResponse.json(
      { error: "genlayer-js SDK shape unexpected: createClient or createAccount missing" },
      { status: 500 },
    );
  }

  try {
    const account = sdk.createAccount(pk);
    const chain = sdk.chains?.studionet ?? sdk.chains?.simulator ?? undefined;
    const client = sdk.createClient({ chain, account } as unknown);

    const oppPayload = {
      title: snap.opportunity.title,
      category: snap.opportunity.category,
      summary: snap.opportunity.summary,
      market: snap.opportunity.market,
      stage: snap.opportunity.stage,
      team_summary: snap.opportunity.team_summary,
      traction_summary: snap.opportunity.traction_summary,
      thesis_text: snap.opportunity.thesis_text,
      evidence_links: snap.opportunity.evidence_links,
      amount_sought: snap.opportunity.amount_sought,
      currency: snap.opportunity.currency,
    };

    const res = await client.writeContract({
      address: CONSENSUS_CAPITAL_CONTRACT,
      functionName: "create_opportunity",
      args: [opportunity_id, JSON.stringify(oppPayload)],
    });
    const hash = typeof res === "string" ? res : (res.hash ?? "");

    if (hash) {
      const sb = getSupabaseAdmin();
      if (sb) {
        await sb.from("transactions").upsert({
          hash,
          wallet: "operator",
          kind: "create_opportunity",
          opportunity_id,
        });
      }
    }
    await saveSnapshot({
      ...snap,
      opportunity: { ...snap.opportunity, status: "UNDER_REVIEW" },
    });

    return NextResponse.json({ ok: true, hash });
  } catch (err) {
    return NextResponse.json(
      { error: `contract write failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}
