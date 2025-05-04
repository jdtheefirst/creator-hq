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
  const body = await req.json();
  const { courseId } = body;

  const { success } = await ratelimit.limit(ip.toString());

  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

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
    // Check if the courseId is valid
    const { data: courseData, error: courseError } = await supabase
      .from("courses")
      .select("id, price, creator_id")
      .eq("id", courseId)
      .single();

    if (courseError || !courseData) {
      console.error("Course not found:", courseError);
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Course Access",
              description: "Access to course content",
            },
            unit_amount: Math.round(Number(courseData.price) * 100),
          },
          quantity: 1,
        },
      ],
      payment_method_types: [
        "card",
        "us_bank_account",
        "link",
        "bancontact",
        "ideal",
      ],
      allow_promotion_codes: true,
      automatic_tax: { enabled: false },
      success_url: `${siteUrl}/courses/success?courseId=${courseId}`,
      cancel_url: `${siteUrl}/courses/cancel?courseId=${courseId}`,
      metadata: {
        userId: user.id,
        courseId: courseId,
        creatorId: courseData.creator_id!,
        type: "course",
      },
    });

    await supabase.from("checkout_sessions").insert({
      user_id: user.id,
      creator_id: courseData.creator_id!,
      type: "course",
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
