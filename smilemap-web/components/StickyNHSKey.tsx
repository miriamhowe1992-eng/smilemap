// /components/StickyNHSKey.tsx
"use client";
import * as React from "react";

export function StickyNHSKey() {
  const [visible, setVisible] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("sm:nhskey:hidden") !== "1";
  });

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-full border bg-white/95 px-3 py-2 shadow-sm backdrop-blur sm:px-4"
         style={{ borderColor: "#e5e9f2" }}>
      <div className="flex items-center gap-3 text-xs sm:text-sm">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full" style={{ background: "#11a36a" }} />
          Green
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full" style={{ background: "#f59e0b" }} />
          Amber
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full" style={{ background: "#ef4444" }} />
          Red
        </span>
        <button
          aria-label="Hide NHS key"
          className="ml-1 rounded-full border px-2 py-0.5 text-[11px] sm:text-xs"
          style={{ borderColor: "#e5e9f2" }}
          onClick={() => {
            setVisible(false);
            try { localStorage.setItem("sm:nhskey:hidden", "1"); } catch {}
          }}
        >
          Hide
        </button>
      </div>
    </div>
  );
}
