import { GENLAYER_STUDIONET, CONSENSUS_CAPITAL_CONTRACT, isContractConfigured } from "@/lib/genlayer/config";

export function ProofPanel({ txHashes = [] }: { txHashes?: string[] }) {
  return (
    <aside className="bg-deep-navy text-ivory-signal rounded-2xl p-5">
      <div className="font-data text-xs text-pearl-aqua">PROOF PANEL</div>
      <div className="mt-2 text-sm">
        <div>NETWORK {GENLAYER_STUDIONET.name}</div>
        <div>CHAIN ID {GENLAYER_STUDIONET.chainId}</div>
        <div className="font-data text-[11px] break-all">
          CONTRACT {isContractConfigured() ? CONSENSUS_CAPITAL_CONTRACT : "not configured"}
        </div>
      </div>
      <div className="mt-4 border-t border-pearl-aqua/20 pt-3">
        <div className="font-data text-xs text-pearl-aqua">TRANSACTIONS</div>
        {txHashes.length === 0 ? (
          <div className="text-xs text-ivory-signal/60 mt-1">No recorded transactions yet.</div>
        ) : (
          <ul className="mt-2 space-y-1 text-xs font-data break-all">
            {txHashes.map((h) => (
              <li key={h}>
                <a
                  className="text-pearl-aqua"
                  href={`${GENLAYER_STUDIONET.explorerUrl}/tx/${h}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {h}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
