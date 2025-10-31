// components/AffiliateStrip.tsx
import * as React from "react";

export function AffiliateStrip() {
  return (
    <aside className="mx-auto mt-8 max-w-6xl px-4">
      <div className="rounded-2xl border bg-white p-4 text-sm text-slate-700">
        <div className="mb-2 font-semibold text-slate-900">Keep your oral health on track</div>
        <ul className="list-disc pl-5">
          <li>
            While waiting for an NHS dentist, consider{" "}
            <a className="underline" href="https://www.amazon.co.uk/s?k=tepe+interdental+brushes&tag=YOUR-AFFILIATE-ID" rel="nofollow sponsored">
              TePe interdental brushes
            </a>{" "}
            and{" "}
            <a className="underline" href="https://www.amazon.co.uk/s?k=fluoride+toothpaste&tag=YOUR-AFFILIATE-ID" rel="nofollow sponsored">
              high-fluoride toothpaste
            </a>.
          </li>
          <li>
            Private options:{" "}
            <a className="underline" href="https://www.denplan.co.uk/find-a-dentist?ref=smilemap" rel="nofollow sponsored">
              Find a Denplan dentist
            </a>.
          </li>
        </ul>
        <p className="mt-2 text-xs text-slate-500">Some links may be affiliate links. We only recommend trusted products.</p>
      </div>
    </aside>
  );
}
