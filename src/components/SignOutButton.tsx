"use client";

import { Button } from "@/components/ui/button";
import { createBrowserClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";

export default function SignOutButton() {
  const searchParams = useSearchParams();
  const supabase = createBrowserClient();

  const handleSignOut = async () => {
    console.log("Signing out");
    try {
      // Sign out on the client side first
      await supabase.auth.signOut();

      // Then call the server-side sign-out endpoint
      const response = await fetch("/api/auth/signout", {
        method: "POST",
        // Add credentials to ensure cookies are sent
        credentials: "include",
      });

      if (response.ok) {
        // Force a hard refresh to clear all state
        // Use the current URL's origin to ensure we're on the right domain
        const baseUrl = window.location.origin;
        window.location.href = `${baseUrl}/login`;
      }
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleSignOut}
      className="text-red-600 hover:text-red-700 hover:bg-red-50"
    >
      Sign Out
    </Button>
  );
}
