"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      // Call the sign-out API endpoint
      const response = await fetch("/api/auth/signout", {
        method: "POST",
      });

      if (response.ok) {
        // Redirect to login page
        router.push("/login");
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
