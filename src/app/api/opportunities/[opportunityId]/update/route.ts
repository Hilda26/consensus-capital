import { NextResponse } from "next/server";
import { getSnapshot, saveSnapshot } from "@/lib/store";
import { CONSENSUS_CAPITAL_CONTRACT, isContractConfigured } from "@/lib/genlayer/config";
import { getSupabaseAdmin } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request, ctx: { params: Promise<{ opportunityId: string }> }) {
  const { opportunityId } = await ctx.params;
  const snap = await getSnapshot(opportunityId);
  if (!snap) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = (await req.json()) as { note?: string; evidence_links?: string[] };
  if (!body.note || !body.note.trim()) {
    return NextResponse.json({ error: "note required" }, { status: 400 });
  }

  const updateId = `upd_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const updatePayload = {
    note: body.note,
    evidence_links: Array.isArray(body.evidence_links) ? body.evidence_links : [],
    created_at: new Date().toISOString(),
  };

  const sb = getSupabaseAdmin();
  if (sb) {
    await sb.from("updates").insert({
      update_id: updateId,
      opportunity_id: opportunityId,
      note: updatePayload.note,
      evidence_links: updatePayload.evidence_links,
    });
  }

  await saveSnapshot({
    ...snap,
    opportunity: { ...snap.opportunity, status: "UPDATED" },
  });

  if (!isContractConfigured() || !process.env.GENLAYER_OPERATOR_PRIVATE_KEY) {
    return NextResponse.json({
      ok: true,
      update_id: updateId,
      warning: "Persisted off chain; operator key or contract address missing.",
    });
  }

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

    const account = sdk.createAccount(
      process.env.GENLAYER_OPERATOR_PRIVATE_KEY as `0x${string}`,
    );
    const client = sdk.createClient({ chain: chains.studionet, account });

    const res = await client.writeContract({
      account,
      address: CONSENSUS_CAPITAL_CONTRACT,
      functionName: "submit_follow_up_update",
      args: [opportunityId, updateId, JSON.stringify(updatePayload)],
      value: 0n,
    });
    const hash =
      typeof res === "string"
        ? res
        : (res as { hash?: string })?.hash ??
          (res as { transactionHash?: string })?.transactionHash ??
          "";

    if (hash && sb) {
      await sb.from("transactions").upsert({
        hash,
        wallet: "operator",
        kind: "submit_follow_up_update",
        opportunity_id: opportunityId,
      });
    }
    return NextResponse.json({ ok: true, update_id: updateId, hash });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: `contract write failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}
