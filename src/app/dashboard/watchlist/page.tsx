"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";

type Item = {
  opportunity_id: string;
  title: string;
  category: string;
  recommendation_band: string | null;
  consensus_score: number | null;
};

type EthLike = { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> };

export default function WatchlistPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [wallet, setWallet] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const eth = (window as unknown as { ethereum?: EthLike }).ethereum;
        if (!eth) {
          setLoading(false);
          return;
        }
        const accs = (await eth.request({ method: "eth_accounts" })) as string[];
        const w = accs?.[0]?.toLowerCase() ?? null;
        setWallet(w);
        if (!w) {
          setLoading(false);
          return;
        }
        const res = await fetch(`/api/watchlist?wallet=${w}`);
        const j = (await res.json()) as { items: Item[] };
        setItems(j.items ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingState label="Loading watchlist" />;
  if (!wallet) {
    return (
      <div>
        <h1 className="font-display text-3xl text-deep-navy">WATCHLIST</h1>
        <div className="mt-6">
          <EmptyState title="Connect your wallet." body="Watchlist is keyed to your wallet address." />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-deep-navy">WATCHLIST</h1>
      <div className="mt-6 grid gap-4">
        {items.length === 0 ? (
          <EmptyState title="No watchlist entries yet." body="Watch a brief to track its consensus updates." />
        ) : (
          items.map((it) => (
            <Link
              key={it.opportunity_id}
              href={`/opportunity/${it.opportunity_id}`}
              className="bg-white/70 border border-dusk-blue/20 rounded-2xl p-5 flex justify-between items-center"
            >
              <div>
                <div className="text-[10px] font-data uppercase text-dusk-blue">{it.category}</div>
                <div className="font-display text-lg text-deep-navy">{it.title}</div>
              </div>
              <div className="font-data text-sm text-dusk-blue">
                {it.consensus_score != null ? Math.round(it.consensus_score) : "--"}{" "}
                {it.recommendation_band ?? "PENDING"}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
