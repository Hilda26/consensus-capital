import Link from "next/link";
import { listSnapshots } from "@/lib/store";
import { DashboardStats } from "@/components/DashboardStats";
import { OpportunityCard } from "@/components/OpportunityCard";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const snaps = await listSnapshots();
  const reviewed = snaps.filter((s) => s.consensus).length;
  const stats = [
    { label: "Opportunities", value: snaps.length },
    { label: "Reviewed", value: reviewed },
    { label: "Pending", value: snaps.length - reviewed },
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
      <DashboardStats stats={stats} />
      <div className="grid gap-4">
        {snaps.length === 0 ? (
          <EmptyState title="Nothing here yet." body="Submit an opportunity to populate your desk." />
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
