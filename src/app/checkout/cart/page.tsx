"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/context/StoreContext";

export default function CheckoutPage() {
  const { state } = useStore();
  const router = useRouter();

  useEffect(() => {
    const checkout = async () => {
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
  }, [state.cart, router]);

  return (
    <div className="p-8 text-center">
      <p>Redirecting to payment...</p>
    </div>
  );
}
