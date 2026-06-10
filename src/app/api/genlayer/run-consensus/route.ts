import { NextResponse } from "next/server";
import { getSnapshot, saveSnapshot } from "@/lib/store";
import { CONSENSUS_CAPITAL_CONTRACT, isContractConfigured } from "@/lib/genlayer/config";
import { getSupabaseAdmin } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!isContractConfigured()) {
    return NextResponse.json({ error: "contract not configured" }, { status: 500 });
  }
  const pk = process.env.GENLAYER_OPERATOR_PRIVATE_KEY as `0x${string}` | undefined;
  if (!pk) {
    return NextResponse.json(
      { error: "GENLAYER_OPERATOR_PRIVATE_KEY not set" },
      { status: 500 },
    );
  }

  const { opportunity_id } = (await req.json()) as { opportunity_id: string };
  const snap = await getSnapshot(opportunity_id);
  if (!snap) return NextResponse.json({ error: "opportunity not found" }, { status: 404 });

  try {
    const sdk = (await import("genlayer-js")) as unknown as {
      createClient: (cfg: unknown) => {
        writeContract: (cfg: {
          account: unknown;
          address: string;
          functionName: string;
          args: unknown[];
          value: bigint;
        }) => Promise<unknown>;
      };
      createAccount: (pk: `0x${string}`) => unknown;
    };
    const chains = (await import("genlayer-js/chains")) as unknown as { studionet: unknown };

    const account = sdk.createAccount(pk);
    const client = sdk.createClient({ chain: chains.studionet, account });

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
      account,
      address: CONSENSUS_CAPITAL_CONTRACT,
      functionName: "create_opportunity",
      args: [opportunity_id, JSON.stringify(oppPayload)],
      value: 0n,
    });

    const hash =
      typeof res === "string"
        ? res
        : (res as { hash?: string; transactionHash?: string })?.hash ??
          (res as { transactionHash?: string })?.transactionHash ??
          "";

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
    console.error("[run-consensus] failed:", err);
    return NextResponse.json(
      { error: `contract write failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}
