"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/context/AuthContext";

export default function SignOutButton() {
  const { supabase } = useAuth();

  const handleSignOut = async () => {
    console.log("Signing out");
    try {
      // Sign out on the client side first
      await supabase.auth.signOut();
      console.log("Client-side sign-out successful");

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
      variant="ghost"
      type="button"
      onClick={handleSignOut}
      className="text-red-600 bg-transparent hover:text-red-700 w-full"
    >
      Sign Out
    </Button>
  );
}
