// /components/LeadModal.tsx
"use client";

import * as React from "react";

type LeadModalProps = {
  open: boolean;
  onClose: () => void;
  practice: {
    id: string;
    name: string;
    address: string;
    status: "GREEN" | "AMBER" | "RED" | "ANY";
    email: string | null; // practice email passed from card
  } | null;
  onSubmitted?: () => void;
};

export function LeadModal({ open, onClose, practice, onSubmitted }: LeadModalProps) {
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const [patientName, setPatientName] = React.useState("");
  const [patientEmail, setPatientEmail] = React.useState("");
  const [patientPhone, setPatientPhone] = React.useState("");
  const [postcode, setPostcode] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [consent, setConsent] = React.useState(true); // default to checked

  React.useEffect(() => {
    if (!open) {
      setSubmitting(false); setError(null); setSuccess(false);
      setPatientName(""); setPatientEmail(""); setPatientPhone("");
      setPostcode(""); setNotes(""); setConsent(true);
    }
  }, [open]);

  if (!open || !practice) return null;

  async function submitLead(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!patientName || (!patientEmail && !patientPhone)) {
      setError("Please provide your name and at least one contact method.");
      return;
    }
    if (!consent) {
      setError("Please tick the consent box so we can contact the practice on your behalf.");
      return;
    }

    setSubmitting(true);
    try {
      const resp = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          practiceId: practice.id,
          practiceName: practice.name,
          practiceAddress: practice.address,
          practiceEmail: practice.email, // ← used by API to email practice
          status: practice.status,
          patientName,
          patientEmail,
          patientPhone,
          postcode,
          notes,
          consent,
        }),
      });
      const json = await resp.json();
      if (!json.ok) throw new Error(json.error || "Failed to submit");

      // analytics hooks
      // @ts-ignore
      window.plausible?.("lead_submitted", { props: { practiceId: practice.id, status: practice.status } });

      setSuccess(true);
      onSubmitted?.();
    } catch (err: any) {
      setError(err?.message || "Could not submit lead");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Request an appointment</h3>
            <p className="text-sm text-slate-600">{practice.name} — {practice.address}</p>
          </div>
          <button className="rounded-full px-3 py-1 text-sm text-slate-600 ring-1 ring-slate-200" onClick={onClose}>Close</button>
        </div>

        {!success ? (
          <form onSubmit={submitLead} className="mt-4 grid gap-3">
            <div className="grid gap-1">
              <label className="text-sm font-medium">Your name</label>
              <input className="rounded-lg border px-3 py-2" required value={patientName} onChange={(e) => setPatientName(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">Email (optional)</label>
              <input type="email" className="rounded-lg border px-3 py-2" value={patientEmail} onChange={(e) => setPatientEmail(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">Phone (optional)</label>
              <input className="rounded-lg border px-3 py-2" value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">Postcode</label>
              <input className="rounded-lg border px-3 py-2" placeholder="e.g. SW1A 1AA" value={postcode} onChange={(e) => setPostcode(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">Notes (optional)</label>
              <textarea className="rounded-lg border px-3 py-2" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <label className="mt-1 flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>
                I agree for SmileMap to contact the practice on my behalf and share my details. See the{" "}
                <a href="/privacy" className="underline">Privacy Policy</a>.
              </span>
            </label>

            {error && <div className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div>}

            <div className="mt-2 flex items-center gap-3">
              <button disabled={submitting} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {submitting ? "Sending…" : "Send request"}
              </button>
              <button type="button" onClick={onClose} className="rounded-xl border px-4 py-2 text-sm">Cancel</button>
            </div>
          </form>
        ) : (
          <div className="mt-4 rounded-lg bg-emerald-50 p-4 text-emerald-800">
            <p className="font-medium">Request sent.</p>
            <p className="text-sm mt-1">We’ve emailed the practice and sent you a confirmation. They’ll contact you directly.</p>
            <div className="mt-3">
              <button className="rounded-xl border px-4 py-2 text-sm" onClick={onClose}>Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
