import Link from "next/link";
import { MemoStack } from "./MemoStack";
import { SignalTabButton } from "./SignalTabButton";

export function ConsensusHero() {
  return (
    <section className="grid md:grid-cols-2 gap-8 md:gap-10 items-center">
      <div>
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-deep-navy leading-tight">
          CONSENSUS<br />CAPITAL
        </h1>
        <p className="mt-3 sm:mt-4 font-display text-lg sm:text-xl text-dusk-blue">
          Many minds. One capital consensus.
        </p>
        <p className="mt-4 sm:mt-6 text-sm sm:text-base text-deep-navy/80 max-w-md">
          Submit an opportunity. Let independent GenLayer evaluators assess risk,
          upside, market fit, team, timing, traction, and moat. Read the consensus.
        </p>
        <div className="mt-6 sm:mt-8 flex flex-col gap-3 w-full max-w-sm">
          <Link href="/submit">
            <SignalTabButton variant="primary" className="w-full">
              {"●"} SUBMIT OPPORTUNITY
            </SignalTabButton>
          </Link>
          <Link href="/explore">
            <SignalTabButton variant="secondary" className="w-full">
              EXPLORE BRIEFS
            </SignalTabButton>
          </Link>
          <p className="text-xs text-dusk-blue mt-1">
            Decision support only. Not financial advice.
          </p>
        </div>
      </div>
      <div>
        <MemoStack />
      </div>
    </section>
  );
}
