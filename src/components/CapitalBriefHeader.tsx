import type { Opportunity } from "@/types/consensus-capital";
import { WatchlistToggle } from "./WatchlistToggle";

export function CapitalBriefHeader({ opportunity }: { opportunity: Opportunity }) {
  return (
    <section className="bg-white/70 border border-dusk-blue/20 rounded-2xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-data uppercase tracking-wider text-dusk-blue">
            {opportunity.category} {"·"} {opportunity.opportunity_id}
          </div>
          <h1 className="font-display text-3xl text-deep-navy mt-1">{opportunity.title}</h1>
          <div className="text-xs font-data text-dusk-blue mt-2">
            proposer {opportunity.proposer_address}
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs font-data text-deep-navy/80">
            <span>MARKET {opportunity.market || "--"}</span>
            <span>STAGE {opportunity.stage || "--"}</span>
            <span>AMOUNT {opportunity.amount_sought || "--"} {opportunity.currency}</span>
            <span>STATUS {opportunity.status}</span>
          </div>
        </div>
        <WatchlistToggle opportunityId={opportunity.opportunity_id} />
      </div>
    </section>
  );
}
