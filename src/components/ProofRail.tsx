import { ReactNode } from "react";
import { ProofPanel } from "./ProofPanel";

export function ProofRail({
  txHashes,
  children,
}: {
  txHashes?: string[];
  children?: ReactNode;
}) {
  return (
    <aside className="grid gap-4">
      <ProofPanel txHashes={txHashes} />
      {children}
    </aside>
  );
}
