// /components/MapView.tsx
"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { Practice } from "./PracticeCard";

// IMPORTANT: load CSS globally in app/globals.css (see Step 1)

// Dynamic imports for react-leaflet (no SSR)
const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((m) => m.Popup),
  { ssr: false }
);

export function MapView({ items }: { items: Practice[] }) {
  // Load leaflet only on client
  const [L, setL] = React.useState<any>(null);
  const [icon, setIcon] = React.useState<any>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const leaflet = await import("leaflet");
      if (!mounted) return;

      // Fix default icon paths (Next.js doesn't serve node_modules assets)
      leaflet.Icon.Default.mergeOptions({
        iconUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      setL(leaflet);

      const i = new leaflet.Icon({
        iconUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });
      setIcon(i);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Center map on first item with coords; otherwise UK center
  const first = items.find((p) => p.lat && p.lng);
  const center: [number, number] = first
    ? [first.lat!, first.lng!]
    : [52.3555, -1.1743]; // UK centroid

  // While leaflet loads, show framed box to avoid layout shift
  if (!L || !icon) {
    return (
      <div
        className="h-[420px] w-full overflow-hidden rounded-2xl ring-1"
        style={{ ringColor: "#e5e9f2" }}
      />
    );
  }

  return (
    <div
      className="h-[420px] w-full overflow-hidden rounded-2xl ring-1"
      style={{ ringColor: "#e5e9f2" }}
    >
      <MapContainer
        center={center}
        zoom={first ? 11 : 6}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {items
          .filter((p) => p.lat && p.lng)
          .map((p) => (
            <Marker key={p.id} position={[p.lat!, p.lng!]} icon={icon}>
              <Popup>
                <strong>{p.name}</strong>
                <br />
                {p.address}
                <br />
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(
                    p.address
                  )}`}
                  target="_blank"
                >
                  Directions
                </a>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
