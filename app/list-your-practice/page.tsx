"use client";

import { useState } from "react";

export default function ListYourPracticePage() {
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setOk(null);
    setErr(null);

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch("/api/add-practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const j = await res.json();
      if (res.ok) {
        setOk("✅ Practice submitted successfully!");
        form.reset();
      } else {
        throw new Error(j.error || "Failed to submit");
      }
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold text-center mb-6 text-sky-700">
        List Your Dental Practice
      </h1>
      <p className="text-center mb-8 text-gray-600">
        Submit your private or mixed practice to appear instantly on SmileMap.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <input required name="name" placeholder="Practice name" className="w-full border p-2 rounded" />
        <input required name="address" placeholder="Address" className="w-full border p-2 rounded" />
        <input required name="postcode" placeholder="Postcode (e.g. SW1A 1AA)" className="w-full border p-2 rounded" />
        <input name="phone" placeholder="Phone" className="w-full border p-2 rounded" />
        <input name="url" placeholder="Website URL" className="w-full border p-2 rounded" />
        <textarea name="facilities" placeholder="Facilities (e.g. Wheelchair, Parking)" className="w-full border p-2 rounded" />
        <select name="practice_type" className="w-full border p-2 rounded">
          <option value="Private">Private</option>
          <option value="Mixed">Mixed (NHS & Private)</option>
        </select>

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-sky-600 text-white py-2 rounded hover:bg-sky-700"
        >
          {busy ? "Submitting..." : "Submit Practice"}
        </button>

        {ok && <p className="text-green-600">{ok}</p>}
        {err && <p className="text-red-600">{err}</p>}
      </form>
    </div>
  );
}
