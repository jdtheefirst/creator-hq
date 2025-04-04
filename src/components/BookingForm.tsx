"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/context/AuthContext";
import { format } from "date-fns";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";

interface BookingFormProps {
  booking?: {
    id: string;
    client_name: string;
    client_email: string;
    service_type: "consultation" | "workshop" | "mentoring" | "other";
    booking_date: string;
    duration_minutes: number;
    status: "pending" | "confirmed" | "completed" | "cancelled";
    price: number;
    payment_status: "pending" | "paid" | "refunded";
    meeting_link?: string;
    notes?: string;
  };
}

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export default function BookingForm({ booking }: BookingFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createBrowserClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_name: booking?.client_name || "",
    client_email: booking?.client_email || "",
    service_type: booking?.service_type || "consultation",
    booking_date: booking?.booking_date
      ? format(new Date(booking.booking_date), "yyyy-MM-dd'T'HH:mm")
      : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    duration_minutes: booking?.duration_minutes || 60,
    price: booking?.price || 0,
    notes: booking?.notes || "",
    meeting_link: booking?.meeting_link || "",
    status: booking?.status || "pending",
    payment_status: booking?.payment_status || "pending",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const bookingData = {
        ...formData,
        creator_id: user?.id,
        booking_date: new Date(formData.booking_date).toISOString(),
      };

      if (booking) {
        // Update existing booking
        const { error } = await supabase
          .from("bookings")
          .update(bookingData)
          .eq("id", booking.id)
          .eq("creator_id", user?.id);

        if (error) throw error;
        toast.success("Booking updated successfully");
      } else {
        // Create new booking
        const { error } = await supabase.from("bookings").insert([bookingData]);

        if (error) {
          if (error.message.includes("booking conflicts")) {
            toast.error("This time slot is already booked");
            return;
          }
          throw error;
        }
        toast.success("Booking created successfully");
      }

      router.push("/dashboard/bookings");
      router.refresh();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to save booking");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (bookingId: string) => {
    try {
      const response = await fetch("/api/bookings/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          creator_id: user?.id,
        }),
      });

      const { sessionId } = await response.json();
      const stripe = await stripePromise;

      if (!stripe) throw new Error("Stripe not loaded");

      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) throw error;
    } catch (err) {
      console.error("Payment error:", err);
      toast.error("Failed to process payment");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white p-6 rounded-lg shadow"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Client Name
          </label>
          <input
            type="text"
            value={formData.client_name}
            onChange={(e) =>
              setFormData({ ...formData, client_name: e.target.value })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Client Email
          </label>
          <input
            type="email"
            value={formData.client_email}
            onChange={(e) =>
              setFormData({ ...formData, client_email: e.target.value })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Service Type
          </label>
          <select
            value={formData.service_type}
            onChange={(e) =>
              setFormData({ ...formData, service_type: e.target.value as any })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="consultation">Consultation</option>
            <option value="workshop">Workshop</option>
            <option value="mentoring">Mentoring</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Date & Time
          </label>
          <input
            type="datetime-local"
            value={formData.booking_date}
            onChange={(e) =>
              setFormData({ ...formData, booking_date: e.target.value })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Duration (minutes)
          </label>
          <input
            type="number"
            value={formData.duration_minutes}
            onChange={(e) =>
              setFormData({
                ...formData,
                duration_minutes: parseInt(e.target.value),
              })
            }
            min="15"
            step="15"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Price ($)
          </label>
          <input
            type="number"
            value={formData.price}
            onChange={(e) =>
              setFormData({ ...formData, price: parseFloat(e.target.value) })
            }
            min="0"
            step="0.01"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        {booking && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as any })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Payment Status
              </label>
              <select
                value={formData.payment_status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    payment_status: e.target.value as any,
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Meeting Link
              </label>
              <input
                type="url"
                value={formData.meeting_link}
                onChange={(e) =>
                  setFormData({ ...formData, meeting_link: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
              Saving...
            </>
          ) : booking ? (
            "Update Booking"
          ) : (
            "Create Booking"
          )}
        </button>
        {booking?.payment_status === "pending" && (
          <button
            type="button"
            onClick={() => handlePayment(booking.id)}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
          >
            Process Payment
          </button>
        )}
      </div>
    </form>
  );
}
