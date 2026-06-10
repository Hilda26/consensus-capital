"use client";
import { ChangeEvent } from "react";

export function OpportunityFilters({
  category,
  band,
  onChange,
}: {
  category: string;
  band: string;
  onChange: (next: { category: string; band: string }) => void;
}) {
  const set = (k: "category" | "band") => (e: ChangeEvent<HTMLSelectElement>) =>
    onChange({ category, band, [k]: e.target.value });

  const sel = "bg-white/70 border border-dusk-blue/30 rounded-lg px-3 py-2 text-sm";

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <select className={sel} value={category} onChange={set("category")}>
        <option value="">All categories</option>
        <option>STARTUP_EQUITY</option>
        <option>TOKEN_OR_PROTOCOL</option>
        <option>TREASURY_ALLOCATION</option>
        <option>ACQUISITION_THESIS</option>
        <option>PARTNERSHIP_THESIS</option>
        <option>COMMUNITY_FUND_PROPOSAL</option>
        <option>MARKET_ENTRY_THESIS</option>
        <option>PUBLIC_GOOD_FUNDING</option>
        <option>EXPERIMENTAL_SPECULATIVE</option>
        <option>OTHER</option>
      </select>
      <select className={sel} value={band} onChange={set("band")}>
        <option value="">All bands</option>
        <option>HIGH_CONVICTION</option>
        <option>WATCHLIST</option>
        <option>SPECULATIVE</option>
        <option>AVOID</option>
      </select>
    </div>
  );
}
