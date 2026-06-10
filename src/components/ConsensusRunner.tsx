"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignalTabButton } from "./SignalTabButton";
import { CONSENSUS_CAPITAL_CONTRACT, GENLAYER_STUDIONET, isContractConfigured } from "@/lib/genlayer/config";
import { STUDIONET_HEX } from "@/lib/genlayer/studionet-chain";
import type { Opportunity } from "@/types/consensus-capital";

type EthLike = {
  request: (a: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, cb: (...a: unknown[]) => void) => void;
};

async function ensureChain(eth: EthLike): Promise<void> {
  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: STUDIONET_HEX }],
    });
  } catch {
    await eth.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: STUDIONET_HEX,
          chainName: GENLAYER_STUDIONET.name,
          nativeCurrency: { name: GENLAYER_STUDIONET.currency, symbol: GENLAYER_STUDIONET.currency, decimals: 18 },
          rpcUrls: [GENLAYER_STUDIONET.rpcUrl],
          blockExplorerUrls: [GENLAYER_STUDIONET.explorerUrl],
        },
      ],
    });
  }
}

async function getAccount(eth: EthLike): Promise<string> {
  const accs = (await eth.request({ method: "eth_requestAccounts" })) as string[];
  if (!accs?.[0]) throw new Error("No wallet account connected");
  return accs[0];
}

async function callGenLayerWrite(
  eth: EthLike,
  from: string,
  method: string,
  args: unknown[],
): Promise<string> {
  const sdk = await import("genlayer-js").catch(() => null);
  if (!sdk) throw new Error("genlayer-js failed to load");

  type GLClient = {
    writeContract: (cfg: {
      address: string;
      functionName: string;
      args: unknown[];
      account?: string;
    }) => Promise<{ hash?: string } | string>;
  };
  type GLSdk = {
    createClient: (cfg: unknown) => GLClient;
    chains?: { studionet?: unknown };
  };
  const anySdk = sdk as unknown as GLSdk;
  if (!anySdk.createClient) throw new Error("genlayer-js createClient missing");

  const chain = anySdk.chains?.studionet;
  const client = anySdk.createClient({
    chain,
    transport: { request: (a: { method: string; params?: unknown[] }) => eth.request(a) },
    account: from,
  } as unknown);

  const res = await client.writeContract({
    address: CONSENSUS_CAPITAL_CONTRACT,
    functionName: method,
    args,
    account: from,
  });
  if (typeof res === "string") return res;
  return res.hash ?? "";
}

export function ConsensusRunner({ opportunity }: { opportunity: Opportunity }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setError(null);
    setStatus("Connecting wallet...");
    setBusy(true);
    try {
      if (!isContractConfigured()) throw new Error("Contract address not configured");
      const eth = (window as unknown as { ethereum?: EthLike }).ethereum;
      if (!eth) throw new Error("No injected wallet detected. Install MetaMask.");

      await ensureChain(eth);
      const account = await getAccount(eth);

      setStatus("Sending create_opportunity to GenLayer...");
      const oppPayload = {
        title: opportunity.title,
        category: opportunity.category,
        summary: opportunity.summary,
        market: opportunity.market,
        stage: opportunity.stage,
        team_summary: opportunity.team_summary,
        traction_summary: opportunity.traction_summary,
        thesis_text: opportunity.thesis_text,
        evidence_links: opportunity.evidence_links,
        amount_sought: opportunity.amount_sought,
        currency: opportunity.currency,
      };
      const hash = await callGenLayerWrite(eth, account, "create_opportunity", [
        opportunity.opportunity_id,
        JSON.stringify(oppPayload),
      ]);

      setStatus(`Tx submitted: ${hash || "(no hash)"}. Recording and waiting for consensus...`);

      await fetch("/api/genlayer/record-tx", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          hash,
          wallet: account,
          kind: "create_opportunity",
          opportunity_id: opportunity.opportunity_id,
        }),
      });

      let attempts = 0;
      while (attempts < 30) {
        attempts += 1;
        setStatus(`Polling consensus (${attempts}/30)...`);
        const r = await fetch("/api/genlayer/sync-opportunity", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ opportunity_id: opportunity.opportunity_id }),
        });
        const j = (await r.json().catch(() => ({}))) as { has_consensus?: boolean };
        if (j.has_consensus) {
          setStatus("Consensus stored. Refreshing...");
          router.refresh();
          return;
        }
        await new Promise((res) => setTimeout(res, 5000));
      }
      setStatus("Consensus did not appear within 2.5 minutes. Check the GenLayer explorer.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white/70 border border-dusk-blue/20 rounded-2xl p-6">
      <h2 className="font-display text-xl text-deep-navy">Run GenLayer Consensus</h2>
      <p className="mt-2 text-sm text-deep-navy/70">
        This sends create_opportunity to the contract from your connected wallet.
        Seven independent evaluators plus an aggregator will run on chain.
      </p>
      <div className="mt-4">
        <SignalTabButton variant="review" disabled={busy} onClick={run}>
          {busy ? "RUNNING..." : "RUN GENLAYER CONSENSUS"}
        </SignalTabButton>
      </div>
      {status && <p className="mt-3 text-xs font-data text-dusk-blue">{status}</p>}
      {error && (
        <div className="mt-3 bg-coral-caution/20 border border-coral-caution rounded-lg p-3">
          <p className="text-deep-navy text-sm font-data">ERROR</p>
          <p className="text-deep-navy text-sm mt-1">{error}</p>
        </div>
      )}
    </div>
  );
}
