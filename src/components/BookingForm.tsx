"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { format } from "date-fns";

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

export default function BookingForm({ booking }: BookingFormProps) {
  const router = useRouter();
  const supabase = createBrowserClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    client_name: booking?.client_name || "",
    client_email: booking?.client_email || "",
    service_type: booking?.service_type || "consultation",
    booking_date: booking
      ? format(new Date(booking.booking_date), "yyyy-MM-dd'T'HH:mm")
      : "",
    duration_minutes: booking?.duration_minutes || 60,
    status: booking?.status || "pending",
    price: booking?.price || 0,
    payment_status: booking?.payment_status || "pending",
    meeting_link: booking?.meeting_link || "",
    notes: booking?.notes || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (booking) {
        // Update existing booking
        const { error } = await supabase
          .from("bookings")
          .update(formData)
          .eq("id", booking.id);

        if (error) throw error;
      } else {
        // Create new booking
        const { error } = await supabase.from("bookings").insert([formData]);

        if (error) throw error;
      }

      router.push("/dashboard/bookings");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Client Information */}
        <div>
          <label
            htmlFor="client_name"
            className="block text-sm font-medium text-gray-700"
          >
            Client Name
          </label>
          <input
            type="text"
            id="client_name"
            value={formData.client_name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, client_name: e.target.value }))
            }
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="client_email"
            className="block text-sm font-medium text-gray-700"
          >
            Client Email
          </label>
          <input
            type="email"
            id="client_email"
            value={formData.client_email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, client_email: e.target.value }))
            }
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Service Information */}
        <div>
          <label
            htmlFor="service_type"
            className="block text-sm font-medium text-gray-700"
          >
            Service Type
          </label>
          <select
            id="service_type"
            value={formData.service_type}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                service_type: e.target.value as typeof formData.service_type,
              }))
            }
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="consultation">Consultation</option>
            <option value="workshop">Workshop</option>
            <option value="mentoring">Mentoring</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="price"
            className="block text-sm font-medium text-gray-700"
          >
            Price
          </label>
          <input
            type="number"
            id="price"
            value={formData.price}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                price: parseFloat(e.target.value),
              }))
            }
            required
            min="0"
            step="0.01"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Booking Details */}
        <div>
          <label
            htmlFor="booking_date"
            className="block text-sm font-medium text-gray-700"
          >
            Date & Time
          </label>
          <input
            type="datetime-local"
            id="booking_date"
            value={formData.booking_date}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, booking_date: e.target.value }))
            }
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="duration_minutes"
            className="block text-sm font-medium text-gray-700"
          >
            Duration (minutes)
          </label>
          <input
            type="number"
            id="duration_minutes"
            value={formData.duration_minutes}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                duration_minutes: parseInt(e.target.value),
              }))
            }
            required
            min="15"
            step="15"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Status and Payment */}
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700"
          >
            Status
          </label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                status: e.target.value as typeof formData.status,
              }))
            }
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="payment_status"
            className="block text-sm font-medium text-gray-700"
          >
            Payment Status
          </label>
          <select
            id="payment_status"
            value={formData.payment_status}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                payment_status: e.target
                  .value as typeof formData.payment_status,
              }))
            }
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {/* Meeting Link */}
        <div>
          <label
            htmlFor="meeting_link"
            className="block text-sm font-medium text-gray-700"
          >
            Meeting Link
          </label>
          <input
            type="url"
            id="meeting_link"
            value={formData.meeting_link}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, meeting_link: e.target.value }))
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-gray-700"
        >
          Notes
        </label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, notes: e.target.value }))
          }
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading
            ? "Saving..."
            : booking
            ? "Update Booking"
            : "Create Booking"}
        </button>
      </div>
    </form>
  );
}
