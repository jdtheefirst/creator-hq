import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();

  try {
    // Sign out the user (Supabase will handle clearing cookies)
    await supabase.auth.signOut();
    console.log("Signed out, redirecting to login");

    // Send success response
    const response = NextResponse.json({ success: true });

    // Ensure no caching
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  } catch (error) {
    console.error("Error during signout:", error);
    return NextResponse.json({
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    });
  }
}
