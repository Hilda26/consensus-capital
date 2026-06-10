"use client";
import { useState } from "react";
import { SignalTabButton } from "./SignalTabButton";
import { GENLAYER_STUDIONET } from "@/lib/genlayer/config";
import type { Opportunity } from "@/types/consensus-capital";

export function ConsensusRunner({ opportunity }: { opportunity: Opportunity }) {
  const [busy, setBusy] = useState(false);
  const [hash, setHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setError(null);
    setHash(null);
    setBusy(true);
    try {
      const res = await fetch("/api/genlayer/run-consensus", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ opportunity_id: opportunity.opportunity_id }),
      });
      const j = (await res.json().catch(() => ({}))) as { hash?: string; error?: string };
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
      setHash(j.hash ?? "(submitted, no hash returned)");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white/70 border border-dusk-blue/20 rounded-2xl p-6">
      <h2 className="font-display text-xl text-deep-navy">Run GenLayer Consensus</h2>
      <p className="mt-2 text-sm text-deep-navy/70">
        This sends create_opportunity to the contract from the operator wallet.
        Seven independent evaluators plus an aggregator will run on chain.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <SignalTabButton variant="review" disabled={busy} onClick={run}>
          {busy ? "SUBMITTING..." : "RUN GENLAYER CONSENSUS"}
        </SignalTabButton>
      </div>

      {hash && (
        <div className="mt-4 bg-mint-ledger/40 border border-aqua-shadow rounded-lg p-3">
          <p className="text-deep-navy text-sm font-data">TX SUBMITTED</p>
          <p className="text-deep-navy text-sm mt-1 break-all font-data">{hash}</p>
          {hash.startsWith("0x") && (
            <a
              href={`${GENLAYER_STUDIONET.explorerUrl}/tx/${hash}`}
              target="_blank"
              rel="noreferrer"
              className="text-dusk-blue text-xs underline mt-2 inline-block"
            >
              View on GenLayer explorer ↗
            </a>
          )}
          <p className="text-deep-navy/70 text-xs mt-3">
            Consensus typically appears within 30-90 seconds. Reload this page to fetch it.
          </p>
        </div>
      )}

      {error && (
        <div className="mt-4 bg-coral-caution/20 border border-coral-caution rounded-lg p-3">
          <p className="text-deep-navy text-sm font-data">ERROR</p>
          <p className="text-deep-navy text-sm mt-1 break-all">{error}</p>
        </div>
      )}
    </div>
  );
}
