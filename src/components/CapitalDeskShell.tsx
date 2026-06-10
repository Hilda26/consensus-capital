"use client";
import Link from "next/link";
import { ReactNode } from "react";
import { WalletConnectButton } from "./WalletConnectButton";

export function CapitalDeskShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-dusk-blue/20 bg-alice-blue/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3 sm:gap-6">
          <Link href="/" className="font-display text-lg sm:text-2xl text-deep-navy whitespace-nowrap">
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
            <WalletConnectButton />
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">{children}</main>
      <nav className="md:hidden border-t border-dusk-blue/20 bg-alice-blue px-2 py-2 flex justify-around text-xs font-data text-dusk-blue">
        <Link href="/explore" className="px-2 py-1">Explore</Link>
        <Link href="/submit" className="px-2 py-1">Submit</Link>
        <Link href="/dashboard" className="px-2 py-1">Dashboard</Link>
        <Link href="/methodology" className="px-2 py-1">Method</Link>
      </nav>
      <footer className="border-t border-dusk-blue/20 px-6 py-6 text-xs text-dusk-blue text-center">
        Decision support only. Not financial advice.
      </footer>
    </div>
  );
}
