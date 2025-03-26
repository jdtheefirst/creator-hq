import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // TODO: Add email validation
    // TODO: Integrate with email service (e.g., Mailchimp, SendGrid)

    // For now, just return success
    return NextResponse.json(
      { message: "Successfully subscribed to newsletter" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to subscribe to newsletter" },
      { status: 500 }
    );
  }
}
