// /components/Testimonials.tsx
"use client";
export function Testimonials() {
  const items = [
    { quote: "Found an NHS dentist in 5 minutes.", who: "Amelia, London" },
    { quote: "Lead emails were instant and clear.", who: "City Dental Care" },
    { quote: "The NHS status made it easy.", who: "Bristol Smile Studio" },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h2 className="text-2xl font-bold text-slate-900">Trusted by patients and practices</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {items.map((t) => (
          <figure key={t.who} className="rounded-2xl bg-white p-5 ring-1" style={{ ringColor: "#e5e9f2" }}>
            <blockquote className="text-slate-800">“{t.quote}”</blockquote>
            <figcaption className="mt-3 text-sm text-slate-600">— {t.who}</figcaption>
          </figure>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-600">
        <span className="rounded-full border px-3 py-1" style={{ borderColor: "#e5e9f2" }}>Made in the UK 🇬🇧</span>
        <span className="rounded-full border px-3 py-1" style={{ borderColor: "#e5e9f2" }}>GDPR compliant</span>
        <span className="rounded-full border px-3 py-1" style={{ borderColor: "#e5e9f2" }}>Data encrypted</span>
      </div>
    </section>
  );
}
