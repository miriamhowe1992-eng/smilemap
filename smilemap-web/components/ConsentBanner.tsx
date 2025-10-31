// /components/ConsentBanner.tsx
"use client";
import * as React from "react";

export function ConsentBanner() {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    const v = localStorage.getItem("smilemap-consent");
    if (!v) setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-4xl rounded-t-2xl border bg-white p-4 shadow-lg">
      <div className="text-sm text-slate-700">
        We use cookies to improve SmileMap. Analytics are optional. See our{" "}
        <a href="/privacy" className="underline">Privacy Policy</a>.
      </div>
      <div className="mt-3 flex gap-2">
        <button
          className="rounded-xl border px-4 py-2 text-sm"
          onClick={() => { localStorage.setItem("smilemap-consent", "essential"); setShow(false); }}
        >
          Essential only
        </button>
        <button
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          onClick={() => { localStorage.setItem("smilemap-consent", "all"); setShow(false); }}
        >
          Accept all
        </button>
      </div>
    </div>
  );
}
