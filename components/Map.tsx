"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import L from "leaflet";

// Use Leaflet's default marker icons (fixes missing icons in Next.js)
const DefaultIcon = L.icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

type Point = {
  lat: number;
  lon: number;
  name?: string;
  url: string;      // NHS profile URL (used to build SmileMap route)
  address?: string;
};

export default function MapView({ points }: { points: Point[] }) {
  const center: LatLngExpression =
    points.length > 0 ? [points[0].lat, points[0].lon] : [51.5074, -0.1278]; // London fallback

  return (
    <div className="h-[420px] rounded-2xl overflow-hidden border">
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {points.map((p, i) => (
          <Marker key={`${p.lat},${p.lon},${i}`} position={[p.lat, p.lon]}>
            <Popup>
              <div className="text-sm">
                <div className="font-medium">
                  {p.name && p.name.trim().length ? p.name : "NHS dental practice"}
                </div>
                {p.address && (
                  <div className="text-slate-600">{p.address}</div>
                )}
                <a
                  className="text-[#11b5d8] underline"
                  href={`/practice?url=${encodeURIComponent(p.url)}`}
                >
                  View practice
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
