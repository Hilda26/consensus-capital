"use client";
import Link from "next/link";
import { ReactNode } from "react";
import { WalletConnectButton } from "./WalletConnectButton";
import { NotificationBell } from "./NotificationBell";

export function CapitalDeskShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-dusk-blue/20 bg-alice-blue/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <Link href="/" className="font-display text-2xl text-deep-navy">
            CONSENSUS CAPITAL
          </Link>
          <nav className="hidden md:flex gap-6 text-sm text-dusk-blue">
            <Link href="/explore">Explore</Link>
            <Link href="/submit">Submit</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/methodology">Methodology</Link>
            <Link href="/consensus">Consensus</Link>
          </nav>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <WalletConnectButton />
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10">{children}</main>
      <footer className="border-t border-dusk-blue/20 px-6 py-6 text-xs text-dusk-blue text-center">
        Decision support only. Not financial advice.
      </footer>
    </div>
  );
}
