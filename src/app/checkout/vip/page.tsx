"use client";

import { useEffect } from "react";
import { redirect, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "sonner";

export default function CheckoutPage() {
  const router = useRouter();
  const { supabase } = useAuth();

  useEffect(() => {
    const handleVipCheckout = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          toast.info("Haven't logged in yet, redirecting to login...");
          return redirect("/login");
        }
        const res = await fetch("/api/checkout/vip", {
          method: "POST",
          cache: "no-cache",
        });

        if (res.ok) {
          const { url } = await res.json();
          window.location.href = url;
        } else {
          const { error, redirect } = await res.json();
          if (redirect) {
            router.push(redirect);
          } else {
            toast.error("Failed to start checkout: " + error?.message);
          }
        }
      } catch (error) {
        console.log(error);
        toast.error("Failed to start checkout, try again later");
      }
    };

    handleVipCheckout();
  }, [router]);

  return (
    <div className="p-8 text-center">
      <p>Redirecting to payment...</p>
    </div>
  );
}
