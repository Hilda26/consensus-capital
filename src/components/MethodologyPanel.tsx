export function MethodologyPanel() {
  return (
    <article className="prose prose-sm max-w-none text-deep-navy">
      <h2 className="font-display text-2xl">Why this needed GenLayer</h2>
      <p>
        A deterministic smart contract can store the opportunity, but it cannot interpret
        ambiguous investment theses, traction quality, market timing, team quality, moat,
        or model disagreement. GenLayer enables independent evaluations and stores a
        consensus result.
      </p>
      <h3 className="font-display text-xl mt-6">Pipeline</h3>
      <ol>
        <li>User submits an opportunity.</li>
        <li>The ConsensusCapital contract stores canonical opportunity JSON.</li>
        <li>Seven independent GenLayer evaluators assess risk, upside, market fit, team, timing, traction, and moat.</li>
        <li>The contract stores each model output.</li>
        <li>An aggregator produces a consensus score, confidence, disagreement index, and recommendation band.</li>
        <li>The frontend renders the Consensus Ledger.</li>
      </ol>
      <h3 className="font-display text-xl mt-6">Bands</h3>
      <ul>
        <li>HIGH_CONVICTION - strong opportunity with coherent thesis and supporting evidence.</li>
        <li>WATCHLIST - promising but needs stronger proof.</li>
        <li>SPECULATIVE - upside may exist, but uncertainty is high.</li>
        <li>AVOID - risk and weakness dominate.</li>
      </ul>
    </article>
  );
}
