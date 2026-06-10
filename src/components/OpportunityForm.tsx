"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignalTabButton } from "./SignalTabButton";
import type { OpportunityCategory } from "@/types/consensus-capital";

const CATEGORIES: OpportunityCategory[] = [
  "STARTUP_EQUITY",
  "TOKEN_OR_PROTOCOL",
  "TREASURY_ALLOCATION",
  "ACQUISITION_THESIS",
  "PARTNERSHIP_THESIS",
  "COMMUNITY_FUND_PROPOSAL",
  "MARKET_ENTRY_THESIS",
  "PUBLIC_GOOD_FUNDING",
  "EXPERIMENTAL_SPECULATIVE",
  "OTHER",
];

type EthLike = {
  request: (a: { method: string; params?: unknown[] }) => Promise<unknown>;
};

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

async function readWalletAddress(): Promise<string> {
  const fallback = "0x0000000000000000000000000000000000000000";
  if (typeof window === "undefined") return fallback;
  const eth = (window as unknown as { ethereum?: EthLike }).ethereum;
  if (!eth) return fallback;
  try {
    const accs = (await withTimeout(eth.request({ method: "eth_accounts" }), 2500)) as string[];
    return accs?.[0] ?? fallback;
  } catch {
    return fallback;
  }
}

export function OpportunityForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const fd = new FormData(e.currentTarget);

    const proposer = await readWalletAddress();

    const payload = {
      title: String(fd.get("title") ?? ""),
      category: String(fd.get("category") ?? "OTHER"),
      summary: String(fd.get("summary") ?? ""),
      market: String(fd.get("market") ?? ""),
      stage: String(fd.get("stage") ?? ""),
      team_summary: String(fd.get("team_summary") ?? ""),
      traction_summary: String(fd.get("traction_summary") ?? ""),
      thesis_text: String(fd.get("thesis_text") ?? ""),
      evidence_links: String(fd.get("evidence_links") ?? "")
        .split("\n").map((s) => s.trim()).filter(Boolean),
      amount_sought: String(fd.get("amount_sought") ?? ""),
      currency: String(fd.get("currency") ?? "USD"),
      proposer_address: proposer,
    };
    try {
      const controller = new AbortController();
      const abortTimer = setTimeout(() => controller.abort(), 25000);
      const res = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }).finally(() => clearTimeout(abortTimer));

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.detail ?? j.error ?? `Submission failed (HTTP ${res.status})`);
      }
      const j = (await res.json()) as { opportunity_id?: string; error?: string };
      if (!j.opportunity_id) throw new Error(j.error ?? "No opportunity id returned");
      router.push(`/opportunity/${j.opportunity_id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg === "The user aborted a request." ? "Request timed out after 25s" : msg);
      setBusy(false);
    }
  }

  const field = "w-full bg-white/60 border border-dusk-blue/30 rounded-lg px-3 py-2 text-deep-navy";
  const label = "block text-xs font-data uppercase tracking-wide text-dusk-blue mb-1";

  return (
    <form onSubmit={onSubmit} className="grid gap-5 max-w-3xl">
      <div>
        <label className={label}>Title</label>
        <input name="title" required className={field} />
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <label className={label}>Category</label>
          <select name="category" className={field} defaultValue="STARTUP_EQUITY">
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Stage</label>
          <input name="stage" className={field} placeholder="SEED, SERIES_A, PUBLIC, etc." />
        </div>
      </div>
      <div>
        <label className={label}>Summary</label>
        <textarea name="summary" rows={2} className={field} />
      </div>
      <div>
        <label className={label}>Thesis</label>
        <textarea name="thesis_text" rows={6} className={field} />
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <label className={label}>Market</label>
          <input name="market" className={field} />
        </div>
        <div>
          <label className={label}>Amount sought</label>
          <input name="amount_sought" className={field} />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <label className={label}>Team summary</label>
          <textarea name="team_summary" rows={3} className={field} />
        </div>
        <div>
          <label className={label}>Traction summary</label>
          <textarea name="traction_summary" rows={3} className={field} />
        </div>
      </div>
      <div>
        <label className={label}>Evidence links (one per line)</label>
        <textarea name="evidence_links" rows={3} className={field} />
      </div>
      <div>
        <label className={label}>Currency</label>
        <input name="currency" className={field} defaultValue="USD" />
      </div>
      {error && (
        <div className="bg-coral-caution/20 border border-coral-caution rounded-lg p-3">
          <p className="text-deep-navy text-sm font-data">ERROR</p>
          <p className="text-deep-navy text-sm mt-1">{error}</p>
        </div>
      )}
      <div>
        <SignalTabButton type="submit" disabled={busy}>
          {busy ? "SAVING..." : "● SUBMIT OPPORTUNITY"}
        </SignalTabButton>
      </div>
    </form>
  );
}
