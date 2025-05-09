"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/context/StoreContext";
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "sonner";

export default function CheckoutPage() {
  const { user } = useAuth();
  const { state } = useStore();
  const router = useRouter();

  useEffect(() => {
    const checkout = async () => {
      if (!user) {
        toast.info("Haven't logged in yet, redirecting to login...");
        return router.push("/login");
      }

      if (!state.cart.length) return router.push("/");

      const res = await fetch("/api/checkout/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart: state.cart }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Failed to create session:", data);
      }
    };

    checkout();
  }, [state.cart, router, user]);

  return (
    <div className="p-8 text-center">
      <p>Redirecting to payment...</p>
    </div>
  );
}
