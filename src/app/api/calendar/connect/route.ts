import { createClient } from "@/lib/supabase/server";
import { getGoogleAuthUrl } from "@/lib/calendar/google";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authUrl = await getGoogleAuthUrl(session.user.id);
    return NextResponse.json({ url: authUrl });
  } catch (error) {
    console.error("Calendar connect error:", error);
    return NextResponse.json(
      { error: "Failed to generate auth URL" },
      { status: 500 }
    );
  }
}
