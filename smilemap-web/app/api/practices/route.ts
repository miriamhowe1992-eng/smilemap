import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import { Practice } from "@/lib/types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").toLowerCase();
  const status = (searchParams.get("status") || "ANY").toUpperCase();
  const services = (searchParams.get("services") || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean); // e.g. invisalign,emergency

  try {
    const file = await fs.readFile("data/practices.json", "utf8");
    const all: Practice[] = JSON.parse(file);

    const filtered = all.filter((p) => {
      const text = `${p.name} ${p.address} ${p.postcode || ""}`.toLowerCase();
      const qOK = !q || text.includes(q);
      const sOK = status === "ANY" || p.status === status;
      const svcOK =
        services.length === 0 ||
        services.every((key) => (p.services as any)?.[key] === true);
      return qOK && sOK && svcOK;
    });

    return NextResponse.json({
      count: filtered.length,
      items: filtered.slice(0, 300),
    });
  } catch {
    return NextResponse.json({ count: 0, items: [] }, { status: 200 });
  }
}
