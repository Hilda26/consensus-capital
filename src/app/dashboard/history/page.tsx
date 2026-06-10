"use client";
import { useEffect, useState } from "react";
import { OpportunityCard } from "@/components/OpportunityCard";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import type { ConsensusResult, Opportunity } from "@/types/consensus-capital";

type EthLike = { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> };
type Item = { opportunity: Opportunity; consensus: ConsensusResult | null };

const STORAGE_KEY = "cc_wallet_disconnected";

export default function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    (async () => {
      if (typeof window === "undefined") return setLoading(false);
      if (localStorage.getItem(STORAGE_KEY) === "1") return setLoading(false);
      const eth = (window as unknown as { ethereum?: EthLike }).ethereum;
      if (!eth) return setLoading(false);
      try {
        const accs = (await eth.request({ method: "eth_accounts" })) as string[];
        const w = accs?.[0]?.toLowerCase() ?? null;
        setWallet(w);
        if (!w) return setLoading(false);
        const res = await fetch(`/api/opportunities?proposer=${w}`);
        const j = (await res.json()) as { items: Item[] };
        setItems(j.items ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl text-deep-navy">REVIEW HISTORY</h1>
      <div className="mt-6 grid gap-4">
        {loading ? (
          <LoadingState label="Loading history" />
        ) : !wallet ? (
          <EmptyState title="Connect your wallet." body="History is scoped to your connected wallet." />
        ) : items.length === 0 ? (
          <EmptyState title="No review history yet." />
        ) : (
          items.map((it) => (
            <OpportunityCard
              key={it.opportunity.opportunity_id}
              opportunity={it.opportunity}
              consensus={it.consensus}
            />
          ))
        )}
      </div>
    </div>
  );
}
