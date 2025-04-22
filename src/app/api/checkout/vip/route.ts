import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ratelimit } from "@/lib/limit";
import { headers } from "next/headers";

export async function POST(req: Request) {
  const headersData = await headers();
  const ip = headersData.get("x-forwarded-for") || "unknown";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { success } = await ratelimit.limit(ip.toString());

  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  const creatorId = process.env.NEXT_PUBLIC_CREATOR_UID;

  // Check if user is authenticated
  if (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Unauthorized", redirect: "/login" },
      { status: 401 }
    );
  }

  // Check if user is valid
  if (!user) {
    console.error("No user found");
    return NextResponse.json(
      { error: "Unauthorized", redirect: "/login" },
      { status: 401 }
    );
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price: process.env.STRIPE_VIP_PRICE_ID,
          quantity: 1,
        },
      ],
      automatic_tax: { enabled: false },
      success_url: `${siteUrl}/vip/success`,
      cancel_url: `${siteUrl}/vip/cancel`,
      metadata: {
        userId: user.id,
        type: "vip",
      },
    });

    await supabase.from("checkout_sessions").insert({
      user_id: user.id,
      creator_id: creatorId, // Assuming all items have the same creator_id
      type: "vip",
      stripe_session_id: session.id,
      total_amount: session.amount_total! / 100,
      currency: "USD",
      items: JSON.stringify({ subscription: "Subscription" }),
      status: "pending",
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe session error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
