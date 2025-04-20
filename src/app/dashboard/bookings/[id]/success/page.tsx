"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/context/AuthContext";

export default function BookingSuccessPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { supabase } = useAuth();

  useEffect(() => {
    const updateBookingStatus = async () => {
      try {
        const { error } = await supabase
          .from("bookings")
          .update({ payment_status: "paid" })
          .eq("id", params.id);

        if (error) throw error;

        // Trigger confirmation emails
        await fetch("/api/bookings/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId: params.id }),
        });

        toast.success("Payment processed successfully");
        router.push("/dashboard/bookings");
      } catch (err) {
        console.error("Error updating booking:", err);
        toast.error("Failed to update booking status");
      }
    };

    updateBookingStatus();
  }, [params.id]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-green-600 mb-4">
          Payment Successful!
        </h1>
        <p className="text-gray-600 mb-4">
          Your booking has been confirmed. You will receive a confirmation email
          shortly.
        </p>
        <button
          onClick={() => router.push("/dashboard/bookings")}
          className="text-blue-600 hover:text-blue-700"
        >
          Return to Bookings
        </button>
      </div>
    </div>
  );
}
