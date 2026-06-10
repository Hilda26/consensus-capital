"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignalTabButton } from "./SignalTabButton";
import type { Opportunity } from "@/types/consensus-capital";

export function ConsensusRunner({ opportunity }: { opportunity: Opportunity }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setError(null);
    setBusy(true);
    try {
      setStatus("Submitting create_opportunity to GenLayer Studionet...");
      const res = await fetch("/api/genlayer/run-consensus", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ opportunity_id: opportunity.opportunity_id }),
      });
      const j = (await res.json().catch(() => ({}))) as { hash?: string; error?: string };
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
      setStatus(`Tx submitted${j.hash ? `: ${j.hash}` : ""}. Polling for consensus...`);

      let attempts = 0;
      while (attempts < 30) {
        attempts += 1;
        setStatus(`Polling consensus (${attempts}/30)...`);
        const r = await fetch("/api/genlayer/sync-opportunity", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ opportunity_id: opportunity.opportunity_id }),
        });
        const sj = (await r.json().catch(() => ({}))) as { has_consensus?: boolean };
        if (sj.has_consensus) {
          setStatus("Consensus stored. Refreshing...");
          router.refresh();
          return;
        }
        await new Promise((res) => setTimeout(res, 5000));
      }
      setStatus("Consensus did not appear within 2.5 minutes. Check the GenLayer explorer.");
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
        This sends create_opportunity to the contract. Seven independent evaluators
        plus an aggregator will run on chain.
      </p>
      <div className="mt-4">
        <SignalTabButton variant="review" disabled={busy} onClick={run}>
          {busy ? "RUNNING..." : "RUN GENLAYER CONSENSUS"}
        </SignalTabButton>
      </div>
      {status && <p className="mt-3 text-xs font-data text-dusk-blue break-all">{status}</p>}
      {error && (
        <div className="mt-3 bg-coral-caution/20 border border-coral-caution rounded-lg p-3">
          <p className="text-deep-navy text-sm font-data">ERROR</p>
          <p className="text-deep-navy text-sm mt-1 break-all">{error}</p>
        </div>
      )}
    </div>
  );
}
