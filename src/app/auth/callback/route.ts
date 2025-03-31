import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  console.log("Auth callback started with code:", code);

  if (!code) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const supabase = await createClient();

  try {
    // Exchange the code for a session
    console.log("Attempting to exchange code for session...");
    const {
      data: { session },
      error,
    } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchanging code for session:", error);
      return NextResponse.redirect(new URL("/login", request.url));
    }

    console.log("Session established successfully");

    if (session?.user) {
      // Check user role for proper redirection
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .single();

      console.log("User role:", userData?.role);

      // Redirect based on role
      const redirectPath = userData?.role === "creator" ? "/dashboard" : "/";
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
  } catch (error) {
    console.error("Error in auth callback:", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Show loading UI while waiting for session
  return new Response(
    `
    <div class="flex min-h-screen items-center justify-center bg-gray-100">
      <div class="bg-white p-6 rounded-lg shadow-lg text-center">
        <div class="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
        <p class="mt-4 text-gray-700">Completing sign in...</p>
      </div>
    </div>
    `,
    {
      headers: {
        "Content-Type": "text/html",
      },
    }
  );
}
