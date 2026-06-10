import Link from "next/link";
import { getSnapshot } from "@/lib/store";
import { CapitalBriefHeader } from "@/components/CapitalBriefHeader";
import { ConsensusLedger } from "@/components/ConsensusLedger";
import { AnalystSeatCard } from "@/components/AnalystSeatCard";
import { ProofRail } from "@/components/ProofRail";
import { EmptyState } from "@/components/EmptyState";
import { SignalTabButton } from "@/components/SignalTabButton";

export const dynamic = "force-dynamic";

export default async function OpportunityPage({
  params,
}: {
  params: Promise<{ opportunityId: string }>;
}) {
  const { opportunityId } = await params;
  const snap = await getSnapshot(opportunityId);
  if (!snap) {
    return (
      <EmptyState
        title="Opportunity not found"
        body="This opportunity does not exist in the local index."
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="grid gap-6">
        <CapitalBriefHeader opportunity={snap.opportunity} />

        <section className="bg-white/70 border border-dusk-blue/20 rounded-2xl p-6">
          <h2 className="font-display text-xl text-deep-navy">Thesis Memo</h2>
          <p className="mt-3 text-sm whitespace-pre-wrap text-deep-navy/90">
            {snap.opportunity.summary}
          </p>
          <p className="mt-3 text-sm whitespace-pre-wrap text-deep-navy/90">
            {snap.opportunity.thesis_text}
          </p>
          <div className="mt-4 grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-data text-xs uppercase text-dusk-blue">Team</div>
              <p>{snap.opportunity.team_summary || "--"}</p>
            </div>
            <div>
              <div className="font-data text-xs uppercase text-dusk-blue">Traction</div>
              <p>{snap.opportunity.traction_summary || "--"}</p>
            </div>
          </div>
          {snap.opportunity.evidence_links.length > 0 && (
            <div className="mt-4">
              <div className="font-data text-xs uppercase text-dusk-blue">Evidence</div>
              <ul className="mt-1 text-sm">
                {snap.opportunity.evidence_links.map((l) => (
                  <li key={l}>
                    <a className="text-dusk-blue underline" href={l} target="_blank" rel="noreferrer">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section>
          <h2 className="font-display text-xl text-deep-navy mb-4">Analyst Seats</h2>
          {snap.models.length === 0 ? (
            <EmptyState title="No model outputs yet." />
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {snap.models.map((m, i) => <AnalystSeatCard key={i} model={m} />)}
            </div>
          )}
        </section>

        {snap.consensus ? (
          <ConsensusLedger consensus={snap.consensus} />
        ) : (
          <EmptyState title="This opportunity has not been reviewed by GenLayer consensus yet." />
        )}

        <section className="bg-white/70 border border-dusk-blue/20 rounded-2xl p-6">
          <h2 className="font-display text-xl text-deep-navy">Why this needed GenLayer</h2>
          <p className="mt-2 text-sm text-deep-navy/80">
            A deterministic smart contract can store the opportunity, but it cannot
            interpret ambiguous investment theses, traction quality, market timing, team
            quality, moat, or model disagreement. GenLayer enables independent
            evaluations and stores a consensus result.
          </p>
        </section>
      </div>

      <ProofRail txHashes={snap.tx_hashes}>
        <Link href={`/opportunity/${opportunityId}/update`}>
          <SignalTabButton variant="review" className="w-full">
            SUBMIT FOLLOW-UP UPDATE
          </SignalTabButton>
        </Link>
      </ProofRail>
    </div>
  );
}
