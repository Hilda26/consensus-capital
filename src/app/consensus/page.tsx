export default function ConsensusPage() {
  return (
    <div className="prose prose-sm max-w-3xl text-deep-navy">
      <h1 className="font-display text-3xl text-deep-navy">CONSENSUS</h1>
      <p>
        Consensus Capital uses GenLayer because investment opportunity review requires
        independent judgement across risk, upside, market fit, team quality, timing,
        traction, and moat, then consensus aggregation of those non-deterministic
        evaluations.
      </p>
      <h3 className="font-display text-xl mt-6">The Consensus Output</h3>
      <ul>
        <li>Consensus score (0-100) - aggregate signal across all dimensions.</li>
        <li>Confidence (0-1) - how much evidence supports the result.</li>
        <li>Disagreement index (0-1) - how much the independent evaluators diverged.</li>
        <li>Recommendation band - HIGH_CONVICTION, WATCHLIST, SPECULATIVE, AVOID.</li>
      </ul>
      <p>
        Consensus Capital is an investment intelligence and decision-support platform.
        It is not a broker, exchange, fund, custody provider, financial adviser, or
        guaranteed prediction engine.
      </p>
    </div>
  );
}
