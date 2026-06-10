"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignalTabButton } from "./SignalTabButton";

export function FollowUpUpdateForm({ opportunityId }: { opportunityId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      note: String(fd.get("note") ?? ""),
      evidence_links: String(fd.get("evidence_links") ?? "")
        .split("\n").map((s) => s.trim()).filter(Boolean),
    };
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}/update`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to submit update");
      router.push(`/opportunity/${opportunityId}`);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const field = "w-full bg-white/60 border border-dusk-blue/30 rounded-lg px-3 py-2";
  return (
    <form onSubmit={onSubmit} className="grid gap-4 max-w-2xl">
      <div>
        <label className="text-xs font-data uppercase text-dusk-blue">Update note</label>
        <textarea name="note" rows={5} required className={field} />
      </div>
      <div>
        <label className="text-xs font-data uppercase text-dusk-blue">Evidence links</label>
        <textarea name="evidence_links" rows={3} className={field} />
      </div>
      {error && <p className="text-coral-caution text-sm">{error}</p>}
      <SignalTabButton variant="review" disabled={busy}>
        {busy ? "RERUNNING CONSENSUS..." : "RUN GENLAYER CONSENSUS"}
      </SignalTabButton>
    </form>
  );
}
