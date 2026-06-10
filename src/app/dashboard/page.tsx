"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardStats } from "@/components/DashboardStats";
import { OpportunityCard } from "@/components/OpportunityCard";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import type { ConsensusResult, Opportunity } from "@/types/consensus-capital";

type EthLike = { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> };
type Item = { opportunity: Opportunity; consensus: ConsensusResult | null };

const STORAGE_KEY = "cc_wallet_disconnected";

export default function DashboardPage() {
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

  const reviewed = items.filter((i) => i.consensus).length;
  const stats = [
    { label: "Opportunities", value: items.length },
    { label: "Reviewed", value: reviewed },
    { label: "Pending", value: items.length - reviewed },
    { label: "Updates", value: 0 },
  ];

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="font-display text-3xl text-deep-navy">DASHBOARD</h1>
        <div className="mt-4 flex gap-4 text-sm">
          <Link className="text-dusk-blue underline" href="/dashboard/watchlist">Watchlist</Link>
          <Link className="text-dusk-blue underline" href="/dashboard/history">History</Link>
        </div>
      </div>

      {loading ? (
        <LoadingState label="Loading dashboard" />
      ) : !wallet ? (
        <EmptyState
          title="Connect your wallet."
          body="Your dashboard is keyed to the connected wallet."
        />
      ) : (
        <>
          <DashboardStats stats={stats} />
          <div className="grid gap-4">
            {items.length === 0 ? (
              <EmptyState title="Nothing here yet." body="Submit an opportunity to populate your desk." />
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
        </>
      )}
    </div>
  );
}
