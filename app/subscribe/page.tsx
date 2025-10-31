"use client";

import { useState } from "react";

export default function SubscribePage() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function startCheckout(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setErr(null);

    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to start checkout");
      window.location.href = j.url; // Stripe Checkout URL
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold text-sky-700">Upgrade to Featured</h1>
      <p className="mt-2 text-slate-600">
        Be shown first in local searches, get a Featured badge, and attract more patients.
      </p>

      <form onSubmit={startCheckout} className="mt-6 space-y-4">
        <input name="email" required placeholder="Billing email" className="w-full border p-2 rounded" />
        <input name="practice_name" required placeholder="Practice name" className="w-full border p-2 rounded" />
        <input name="practice_url" required placeholder="Practice NHS or website URL" className="w-full border p-2 rounded" />
        <input name="postcode" required placeholder="Practice postcode" className="w-full border p-2 rounded" />
        <button disabled={busy} className="w-full bg-sky-600 text-white py-2 rounded hover:bg-sky-700">
          {busy ? "Redirecting…" : "Subscribe (Monthly)"}
        </button>
        {err && <p className="text-red-600">{err}</p>}
      </form>
    </div>
  );
}
