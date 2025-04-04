import { createClient } from "@/lib/supabase/server";
import { oauth2Client } from "@/lib/calendar/google";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  try {
    const { userId } = JSON.parse(Buffer.from(state, "base64").toString());
    const { tokens } = await oauth2Client.getToken(code);

    // Store tokens in Supabase
    await supabase.from("creator_calendar_tokens").upsert({
      creator_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
    });

    // Redirect to success page
    return NextResponse.redirect(
      new URL("/dashboard/settings/calendar?connected=true", request.url)
    );
  } catch (error) {
    console.error("Calendar callback error:", error);
    return NextResponse.redirect(
      new URL("/dashboard/settings/calendar?error=true", request.url)
    );
  }
}
