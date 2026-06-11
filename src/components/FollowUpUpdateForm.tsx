"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignalTabButton } from "./SignalTabButton";
import { GENLAYER_STUDIONET } from "@/lib/genlayer/config";

type SyncResponse = {
  has_consensus?: boolean;
  consensus_score?: number | null;
  consensus_reasoning?: string | null;
  model_count?: number;
};

const POLL_INTERVAL_MS = 8000;
const MAX_POLL_ATTEMPTS = 120; // 8s * 120 = 16 minutes

export function FollowUpUpdateForm({
  opportunityId,
  baselineConsensusScore,
  baselineReasoning,
}: {
  opportunityId: string;
  baselineConsensusScore: number | null;
  baselineReasoning: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setHash(null);
    setStatus(null);

    const fd = new FormData(e.currentTarget);
    const payload = {
      note: String(fd.get("note") ?? ""),
      evidence_links: String(fd.get("evidence_links") ?? "")
        .split("\n").map((s) => s.trim()).filter(Boolean),
    };

    setBusy(true);
    setStatus("Submitting update to the contract...");

    try {
      const res = await fetch(`/api/opportunities/${opportunityId}/update`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = (await res.json().catch(() => ({}))) as {
        hash?: string;
        error?: string;
        warning?: string;
      };
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
      if (j.hash) setHash(j.hash);

      setStatus("Update submitted. Waiting for new consensus on chain (typical: 3-15 minutes)...");

      for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt += 1) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        setStatus(`Polling for updated consensus (${attempt}/${MAX_POLL_ATTEMPTS})...`);

        const sync = await fetch("/api/genlayer/sync-opportunity", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ opportunity_id: opportunityId }),
        });
        const sj = (await sync.json().catch(() => ({}))) as SyncResponse;

        if (!sj.has_consensus) continue;

        const changedScore =
          sj.consensus_score != null &&
          sj.consensus_score !== baselineConsensusScore;
        const changedReasoning =
          sj.consensus_reasoning != null &&
          sj.consensus_reasoning !== baselineReasoning;

        if (changedScore || changedReasoning) {
          setStatus("New consensus stored. Refreshing the brief...");
          router.push(`/opportunity/${opportunityId}`);
          router.refresh();
          return;
        }
      }

      setStatus(
        "Update was submitted, but the new consensus did not appear within the polling window. The brief will update once the contract finalizes - reload manually in a few minutes.",
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const field = "w-full bg-white/60 border border-dusk-blue/30 rounded-lg px-3 py-2";
  return (
    <form onSubmit={onSubmit} className="grid gap-4 max-w-2xl">
      <div>
        <label className="text-xs font-data uppercase text-dusk-blue">Update note</label>
        <textarea name="note" rows={5} required className={field} disabled={busy} />
      </div>
      <div>
        <label className="text-xs font-data uppercase text-dusk-blue">Evidence links</label>
        <textarea name="evidence_links" rows={3} className={field} disabled={busy} />
      </div>

      <SignalTabButton variant="review" disabled={busy}>
        {busy ? "RUNNING CONSENSUS..." : "RUN GENLAYER CONSENSUS"}
      </SignalTabButton>

      {hash && (
        <div className="bg-mint-ledger/40 border border-aqua-shadow rounded-lg p-3">
          <p className="text-deep-navy text-sm font-data">UPDATE TX SUBMITTED</p>
          <p className="text-deep-navy text-xs mt-1 break-all font-data">{hash}</p>
          {hash.startsWith("0x") && (
            <a
              href={`${GENLAYER_STUDIONET.explorerUrl}/tx/${hash}`}
              target="_blank"
              rel="noreferrer"
              className="text-dusk-blue text-xs underline mt-1 inline-block"
            >
              View on GenLayer explorer ↗
            </a>
          )}
        </div>
      )}

      {status && (
        <p className="text-xs font-data text-dusk-blue break-all">{status}</p>
      )}

      {error && (
        <div className="bg-coral-caution/20 border border-coral-caution rounded-lg p-3">
          <p className="text-deep-navy text-sm font-data">ERROR</p>
          <p className="text-deep-navy text-sm mt-1 break-all">{error}</p>
        </div>
      )}
    </form>
  );
}
