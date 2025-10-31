const isAppointments = typeof nhsHref === "string" && nhsHref.includes("/appointments");
...
{nhsHref !== "#" && (
  <a
    href={nhsHref}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:underline"
    title="Open on the official NHS website"
  >
    View on NHS →
    {isAppointments && (
      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold ring-1"
            style={{ ringColor: "#bfdbfe", color: "#1d4ed8" }}>
        Appointments page
      </span>
    )}
  </a>
// wherever you build your filter buttons, add this one if useful
{ /* Hide Unknown */ }
<button
  onClick={() => setStatus("ANY")}
  className={`rounded-full border px-3 py-1.5 text-sm ${status==="ANY"?"bg-slate-50 font-semibold":""}`}
  style={{ borderColor: status==="ANY" ? "#2bbecb" : "#e5e9f2" }}
>
  All (no filter)
</button>
<button
  onClick={() => setStatus("GREEN")}
  className={`rounded-full border px-3 py-1.5 text-sm ${status==="GREEN"?"bg-slate-50 font-semibold":""}`}
  style={{ borderColor: status==="GREEN" ? "#2bbecb" : "#e5e9f2" }}
>
  NHS: Green
</button>
{/* keep Amber/Red as you have */}

)}
