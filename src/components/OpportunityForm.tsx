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

type Eth = { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> };
declare global { interface Window { ethereum?: Eth } }

export function OpportunityForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    let proposer = "0x0000000000000000000000000000000000000000";
    try {
      const eth = typeof window !== "undefined" ? window.ethereum : undefined;
      if (eth) {
        const accs = (await eth.request({ method: "eth_accounts" })) as string[];
        if (accs[0]) proposer = accs[0];
      }
    } catch {
      // ignore - keep zero address
    }

    const fd = new FormData(e.currentTarget);
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
      const res = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.detail ?? j.error ?? "Submission failed");
      }
      const j = (await res.json()) as { opportunity_id: string };
      router.push(`/opportunity/${j.opportunity_id}`);
    } catch (err) {
      setError((err as Error).message);
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
      {error && <p className="text-coral-caution text-sm">{error}</p>}
      <div>
        <SignalTabButton type="submit" disabled={busy}>
          {busy ? "SAVING..." : "● SUBMIT OPPORTUNITY"}
        </SignalTabButton>
      </div>
    </form>
  );
}
