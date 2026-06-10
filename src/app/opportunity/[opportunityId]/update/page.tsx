import { FollowUpUpdateForm } from "@/components/FollowUpUpdateForm";

export default async function UpdatePage({
  params,
}: {
  params: Promise<{ opportunityId: string }>;
}) {
  const { opportunityId } = await params;
  return (
    <div>
      <h1 className="font-display text-3xl text-deep-navy">FOLLOW-UP UPDATE</h1>
      <p className="mt-2 text-sm text-dusk-blue">
        New evidence triggers a rerun of GenLayer consensus.
      </p>
      <div className="mt-8">
        <FollowUpUpdateForm opportunityId={opportunityId} />
      </div>
    </div>
  );
}
