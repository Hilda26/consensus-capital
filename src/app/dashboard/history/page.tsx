import { listSnapshots } from "@/lib/store";
import { OpportunityCard } from "@/components/OpportunityCard";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const snaps = await listSnapshots();
  return (
    <div>
      <h1 className="font-display text-3xl text-deep-navy">REVIEW HISTORY</h1>
      <div className="mt-6 grid gap-4">
        {snaps.length === 0 ? (
          <EmptyState title="No review history yet." />
        ) : (
          snaps.map((s) => (
            <OpportunityCard
              key={s.opportunity.opportunity_id}
              opportunity={s.opportunity}
              consensus={s.consensus}
            />
          ))
        )}
      </div>
    </div>
  );
}
