import { EmptyState } from "@/components/EmptyState";

export default function WatchlistPage() {
  return (
    <div>
      <h1 className="font-display text-3xl text-deep-navy">WATCHLIST</h1>
      <div className="mt-6">
        <EmptyState title="No watchlist entries yet." body="Watch a brief to track its consensus updates." />
      </div>
    </div>
  );
}
