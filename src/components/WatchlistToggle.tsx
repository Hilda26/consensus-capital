"use client";
import { useState } from "react";

export function WatchlistToggle({ opportunityId }: { opportunityId: string }) {
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}/watch`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ watching: !on }),
      });
      if (res.ok) setOn(!on);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className="signal-tab bg-thistle text-deep-navy font-display px-3 py-2 text-xs"
    >
      {on ? "WATCHING" : "WATCH"}
    </button>
  );
}
