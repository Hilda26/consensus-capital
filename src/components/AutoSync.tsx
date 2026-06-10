"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function AutoSync({
  opportunityId,
  alreadyHasConsensus,
}: {
  opportunityId: string;
  alreadyHasConsensus: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sync = async (manual: boolean) => {
    setBusy(true);
    setStatus(manual ? "Pulling latest state from contract..." : "Checking contract for updates...");
    try {
      const r = await fetch("/api/genlayer/sync-opportunity", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ opportunity_id: opportunityId }),
      });
      const j = (await r.json().catch(() => ({}))) as {
        has_consensus?: boolean;
        model_count?: number;
        error?: string;
      };
      if (j.error) {
        setStatus(`Sync error: ${j.error}`);
        return;
      }
      if (j.has_consensus) {
        setStatus("Consensus found on chain. Refreshing...");
        router.refresh();
      } else if ((j.model_count ?? 0) > 0) {
        setStatus(`Found ${j.model_count} model outputs on chain. Consensus not yet stored.`);
        router.refresh();
      } else {
        setStatus("No consensus on chain yet for this opportunity.");
      }
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (alreadyHasConsensus) return;
    sync(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opportunityId, alreadyHasConsensus]);

  return (
    <div className="flex items-center gap-3 text-xs font-data text-dusk-blue">
      <button
        onClick={() => sync(true)}
        disabled={busy}
        className="border border-dusk-blue rounded px-3 py-1 text-deep-navy hover:bg-dusk-blue/10 disabled:opacity-50"
      >
        {busy ? "SYNCING..." : "REFRESH FROM CHAIN"}
      </button>
      {status && <span>{status}</span>}
    </div>
  );
}
