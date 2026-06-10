"use client";
import { useEffect, useState } from "react";

type EthLike = { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> };

async function getWallet(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const eth = (window as unknown as { ethereum?: EthLike }).ethereum;
  if (!eth) return null;
  try {
    const accs = (await eth.request({ method: "eth_accounts" })) as string[];
    return accs?.[0]?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

export function WatchlistToggle({ opportunityId }: { opportunityId: string }) {
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const wallet = await getWallet();
      if (!wallet) return;
      try {
        const res = await fetch(
          `/api/opportunities/${opportunityId}/watch?wallet=${wallet}`,
        );
        const j = (await res.json()) as { watching: boolean };
        setOn(Boolean(j.watching));
      } catch {
        // ignore
      }
    })();
  }, [opportunityId]);

  async function toggle() {
    setBusy(true);
    try {
      const wallet = await getWallet();
      if (!wallet) {
        alert("Connect a wallet to watch this brief.");
        return;
      }
      const next = !on;
      const res = await fetch(`/api/opportunities/${opportunityId}/watch`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ watching: next, wallet }),
      });
      if (res.ok) setOn(next);
      else {
        const j = await res.json().catch(() => ({}));
        alert(`Watch failed: ${j.error ?? res.status}`);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className="signal-tab bg-thistle text-deep-navy font-display px-3 py-2 text-xs"
    >
      {busy ? "..." : on ? "WATCHING" : "WATCH"}
    </button>
  );
}
