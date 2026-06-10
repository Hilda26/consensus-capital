import { listSnapshots } from "@/lib/store";
import { OpportunityCard } from "@/components/OpportunityCard";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const snaps = await listSnapshots();

  return (
    <div>
      <h1 className="font-display text-3xl text-deep-navy">CAPITAL BRIEF GALLERY</h1>
      <p className="mt-2 text-sm text-dusk-blue">All opportunities submitted for GenLayer consensus review.</p>

      <div className="mt-8 grid gap-4">
        {snaps.length === 0 ? (
          <EmptyState
            title="No opportunities submitted yet."
            body="Submit the first opportunity for GenLayer consensus review."
          />
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
