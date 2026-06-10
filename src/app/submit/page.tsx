import { OpportunityForm } from "@/components/OpportunityForm";

export default function SubmitPage() {
  return (
    <div>
      <h1 className="font-display text-3xl text-deep-navy">SUBMIT OPPORTUNITY</h1>
      <p className="mt-2 text-sm text-dusk-blue">
        Independent GenLayer evaluators will assess the opportunity. Final consensus is stored on chain.
      </p>
      <div className="mt-8">
        <OpportunityForm />
      </div>
    </div>
  );
}
