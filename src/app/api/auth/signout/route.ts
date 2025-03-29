import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookiesStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookiesStore });

  // Sign out the user
  await supabase.auth.signOut();

  // Clear any remaining cookies
  const response = NextResponse.json({ success: true });
  response.cookies.delete("sb-access-token");
  response.cookies.delete("sb-refresh-token");

  return response;
}
