"use client";
import { useEffect, useState } from "react";
import { OpportunityCard } from "@/components/OpportunityCard";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import type { ConsensusResult, Opportunity } from "@/types/consensus-capital";

type EthLike = { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> };
type Item = { opportunity: Opportunity; consensus: ConsensusResult | null };

const STORAGE_KEY = "cc_wallet_disconnected";

export default function ExplorePage() {
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    (async () => {
      if (typeof window === "undefined") {
        setLoading(false);
        return;
      }
      if (localStorage.getItem(STORAGE_KEY) === "1") {
        setLoading(false);
        return;
      }
      const eth = (window as unknown as { ethereum?: EthLike }).ethereum;
      if (!eth) {
        setLoading(false);
        return;
      }
      try {
        const accs = (await eth.request({ method: "eth_accounts" })) as string[];
        const w = accs?.[0]?.toLowerCase() ?? null;
        setWallet(w);
        if (!w) {
          setLoading(false);
          return;
        }
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
      <h1 className="font-display text-3xl text-deep-navy">CAPITAL BRIEF GALLERY</h1>
      <p className="mt-2 text-sm text-dusk-blue">Briefs you have submitted for GenLayer consensus review.</p>

      <div className="mt-8 grid gap-4">
        {loading ? (
          <LoadingState label="Loading briefs" />
        ) : !wallet ? (
          <EmptyState
            title="Connect your wallet."
            body="Briefs are scoped to your connected wallet."
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="No briefs from this wallet yet."
            body="Submit an opportunity for GenLayer consensus review."
          />
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
