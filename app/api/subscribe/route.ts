import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, practice_name, practice_url, postcode } = body || {};
    if (!email || !practice_name || !practice_url || !postcode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      success_url: `${process.env.SITE_URL}/subscribe/success`,
      cancel_url: `${process.env.SITE_URL}/subscribe/cancel`,
      customer_email: email,
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
      metadata: {
        practice_name,
        practice_url,
        postcode,
        email,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Stripe error" }, { status: 500 });
  }
}
