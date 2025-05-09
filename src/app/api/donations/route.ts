import { NextResponse } from "next/server";
import Stripe from "stripe";

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

export async function POST(request: Request) {
  try {
    const { amount, currency = "usd" } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid donation amount" },
        { status: 400 }
      );
    }

    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        type: "donation",
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Donation error:", error);
    return NextResponse.json(
      { error: "Failed to process donation" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // TODO: Add authentication check
    // TODO: Fetch donation history from database

    return NextResponse.json({ donations: [] }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch donations" },
      { status: 500 }
    );
  }
}
