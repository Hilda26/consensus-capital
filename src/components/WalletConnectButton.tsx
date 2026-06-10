"use client";
import { useEffect, useRef, useState } from "react";
import { GENLAYER_STUDIONET } from "@/lib/genlayer/config";

type Eth = { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> };
declare global { interface Window { ethereum?: Eth } }

const STORAGE_KEY = "cc_wallet_disconnected";

export function WalletConnectButton() {
  const [address, setAddress] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY) === "1") return;
    const eth = window.ethereum;
    if (!eth) return;
    eth
      .request({ method: "eth_accounts" })
      .then((accs) => {
        const a = (accs as string[])[0];
        if (a) setAddress(a);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const connect = async () => {
    const eth = window.ethereum;
    if (!eth) {
      alert("No injected wallet detected.");
      return;
    }
    try {
      const accs = (await eth.request({ method: "eth_requestAccounts" })) as string[];
      if (accs[0]) {
        setAddress(accs[0]);
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore user reject
    }
  };

  const disconnect = () => {
    setAddress(null);
    setOpen(false);
    localStorage.setItem(STORAGE_KEY, "1");
  };

  const copy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const short = (a: string) => `${a.slice(0, 6)}...${a.slice(-4)}`;

  if (!address) {
    return (
      <button
        onClick={connect}
        className="signal-tab bg-pearl-aqua text-deep-navy font-display px-4 py-2 text-sm"
      >
        CONNECT WALLET
      </button>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="signal-tab bg-pearl-aqua text-deep-navy font-display px-4 py-2 text-sm"
      >
        {short(address)}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-dusk-blue/30 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-dusk-blue/20">
            <div className="text-[10px] font-data uppercase text-dusk-blue">CONNECTED</div>
            <div className="text-deep-navy font-data text-xs break-all mt-1">{address}</div>
          </div>
          <button
            onClick={copy}
            className="w-full text-left px-4 py-2 text-sm text-deep-navy hover:bg-alice-blue"
          >
            {copied ? "Copied!" : "Copy address"}
          </button>
          <a
            href={`${GENLAYER_STUDIONET.explorerUrl}/address/${address}`}
            target="_blank"
            rel="noreferrer"
            className="block px-4 py-2 text-sm text-deep-navy hover:bg-alice-blue"
            onClick={() => setOpen(false)}
          >
            View on explorer ↗
          </a>
          <button
            onClick={disconnect}
            className="w-full text-left px-4 py-2 text-sm text-coral-caution hover:bg-coral-caution/10 border-t border-dusk-blue/20"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
