import { FollowUpUpdateForm } from "@/components/FollowUpUpdateForm";
import { getSnapshot } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function UpdatePage({
  params,
}: {
  params: Promise<{ opportunityId: string }>;
}) {
  const { opportunityId } = await params;
  let baselineScore: number | null = null;
  let baselineReasoning: string | null = null;
  try {
    const snap = await getSnapshot(opportunityId);
    if (snap?.consensus) {
      baselineScore = snap.consensus.consensus_score;
      baselineReasoning = snap.consensus.reasoning;
    }
  } catch {
    // ignore - baselines stay null; the form will treat any new consensus as a change
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-deep-navy">FOLLOW-UP UPDATE</h1>
      <p className="mt-2 text-sm text-dusk-blue">
        New evidence triggers a rerun of GenLayer consensus. The brief will
        refresh automatically when the new consensus lands on chain.
      </p>
      <div className="mt-8">
        <FollowUpUpdateForm
          opportunityId={opportunityId}
          baselineConsensusScore={baselineScore}
          baselineReasoning={baselineReasoning}
        />
      </div>
    </div>
  );
}
