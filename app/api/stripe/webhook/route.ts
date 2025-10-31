import { NextResponse } from "next/server";
import Stripe from "stripe";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

const BASE = path.resolve(process.cwd(), "..");
const OUTPUTS = path.join(BASE, "outputs");
const FEATURED = path.join(OUTPUTS, "featured_practices.json");

async function loadFeatured(): Promise<Record<string, { featured_until: string; practice_name: string; postcode: string; email: string }>> {
  try {
    const txt = await fs.readFile(FEATURED, "utf8");
    return JSON.parse(txt || "{}");
  } catch {
    return {};
  }
}
async function saveFeatured(data: any) {
  await fs.mkdir(OUTPUTS, { recursive: true });
  await fs.writeFile(FEATURED, JSON.stringify(data, null, 2), "utf8");
}

function plusDays(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature") || "";
  const buf = Buffer.from(await req.arrayBuffer());

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 });
  }

  // Handle subscription activation/renewal
  if (event.type === "checkout.session.completed" || event.type === "invoice.payment_succeeded") {
    const data = event.data.object as any;

    // checkout.session: metadata on the session
    // invoice.payment_succeeded: metadata mostly on subscription/customer; we’ll try both
    const md = data.metadata || data.lines?.data?.[0]?.metadata || {};
    const practice_url = (md.practice_url || data?.metadata?.practice_url || "").trim();
    const practice_name = (md.practice_name || data?.metadata?.practice_name || "").trim();
    const postcode = (md.postcode || data?.metadata?.postcode || "").trim();
    const email = (data.customer_email || data.customer_details?.email || md.email || "").trim();

    if (practice_url) {
      const featured = await loadFeatured();
      featured[practice_url] = {
        featured_until: plusDays(30), // simple monthly window
        practice_name: practice_name || featured[practice_url]?.practice_name || "",
        postcode: postcode || featured[practice_url]?.postcode || "",
        email: email || featured[practice_url]?.email || "",
      };
      await saveFeatured(featured);
    }
  }

  return NextResponse.json({ received: true });
}
