"use client";
import { useEffect, useState } from "react";

type Eth = { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> };
declare global { interface Window { ethereum?: Eth } }

export function WalletConnectButton() {
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    const eth = typeof window !== "undefined" ? window.ethereum : undefined;
    if (!eth) return;
    eth.request({ method: "eth_accounts" }).then((accs) => {
      const a = (accs as string[])[0];
      if (a) setAddress(a);
    }).catch(() => undefined);
  }, []);

  const connect = async () => {
    const eth = window.ethereum;
    if (!eth) {
      alert("No injected wallet detected.");
      return;
    }
    const accs = (await eth.request({ method: "eth_requestAccounts" })) as string[];
    if (accs[0]) setAddress(accs[0]);
  };

  const short = (a: string) => `${a.slice(0, 6)}...${a.slice(-4)}`;

  return (
    <button
      onClick={connect}
      className="signal-tab bg-pearl-aqua text-deep-navy font-display px-4 py-2 text-sm"
    >
      {address ? short(address) : "CONNECT WALLET"}
    </button>
  );
}
