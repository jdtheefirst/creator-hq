import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const body = await req.json();
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // Check if user is authenticated
  if (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is valid
  if (!user) {
    console.error("No user found");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if the cart is empty
  if (!body.cart || body.cart.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  // Check if all items in the cart have a product
  if (!body.cart.every((item: any) => item.product)) {
    return NextResponse.json({ error: "Invalid cart items" }, { status: 400 });
  }

  const line_items = body.cart.map((item: any) => ({
    price_data: {
      currency: item.product.currency,
      product_data: {
        name: item.product.name,
      },
      unit_amount: Math.round(item.product.price * 100),
    },
    quantity: item.quantity,
  }));

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      shipping_address_collection: {
        allowed_countries: ["US", "CA", "KE", "GB"], // Add more countries as needed
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: 0,
              currency: "usd",
            },
            display_name: "Free shipping",
            delivery_estimate: {
              minimum: {
                unit: "business_day",
                value: 5,
              },
              maximum: {
                unit: "business_day",
                value: 7,
              },
            },
          },
        },
      ],
      automatic_tax: { enabled: false },
      success_url: `${siteUrl}/store/success`,
      cancel_url: `${siteUrl}/store/cancel`,
      metadata: {
        userId: user.id, // Replace with actual auth user
        type: "order",
        cart: JSON.stringify(
          body.cart.map((item: any) => ({
            id: item.product.id,
            quantity: item.quantity,
            unit_price: item.product.price,
            name: item.product.name,
            currency: item.product.currency,
            purchasable_type: item.product.purchasable_type,
          }))
        ),
      },
    });

    await supabase.from("checkout_sessions").insert({
      user_id: user.id,
      creator_id: body.cart[0].product.creator_id, // Assuming all items have the same creator_id
      type: "order",
      stripe_session_id: session.id,
      total_amount: session.amount_total! / 100,
      currency: "USD",
      items: JSON.stringify(line_items),
      status: "pending",
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe session error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
