import { listSnapshots } from "@/lib/store";
import { OpportunityCard } from "@/components/OpportunityCard";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ wallet: string }>;
}) {
  const { wallet } = await params;
  const all = await listSnapshots();
  const mine = all.filter(
    (s) => s.opportunity.proposer_address.toLowerCase() === wallet.toLowerCase()
  );

  return (
    <div>
      <h1 className="font-display text-3xl text-deep-navy">PROPOSER</h1>
      <div className="font-data text-sm text-dusk-blue break-all mt-1">{wallet}</div>
      <div className="mt-8 grid gap-4">
        {mine.length === 0 ? (
          <EmptyState title="No opportunities from this proposer yet." />
        ) : (
          mine.map((s) => (
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
