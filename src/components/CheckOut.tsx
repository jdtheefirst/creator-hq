"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "sonner";

export default function CheckOut() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { supabase, user } = useAuth();

  useEffect(() => {
    const handleCheckout = async () => {
      const courseId = searchParams.get("courseId");
      const type = searchParams.get("type"); // "free" or "pay"

      if (!courseId || !type) {
        toast.error("Missing checkout information.");
        return router.push("/courses");
      }

      if (!user) {
        toast.info("You need to log in first.");
        return router.push("/login");
      }

      if (type === "free") {
        const responce = await fetch("/api/checkout/update-course", {
          method: "POST",
          cache: "no-cache",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId, userId: user.id }),
        });

        if (!responce.ok) {
          const { error } = await responce.json();
          toast.error("Failed to enroll in the course: " + error?.message);
          return router.push("/courses");
        }

        toast.success("You’re enrolled! 🎉");
        router.push(`/courses/${courseId}`);
      } else {
        // PAID COURSE FLOW (stripe)
        const res = await fetch("/api/checkout/course", {
          method: "POST",
          cache: "no-cache",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId }),
        });

        if (res.ok) {
          const { url } = await res.json();
          window.location.href = url;
        } else {
          const { error, redirect } = await res.json();
          if (redirect) {
            router.push(redirect);
          } else {
            toast.error("Stripe checkout failed: " + error?.message);
          }
        }
      }
    };

    handleCheckout();
  }, [router, searchParams, supabase, user]);

  return (
    <div className="p-8 text-center">
      <p>Redirecting to payment or enrollment...</p>
    </div>
  );
}
