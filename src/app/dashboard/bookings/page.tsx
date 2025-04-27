"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Booking {
  id: string;
  client_name: string;
  client_email: string;
  service_type: string;
  booking_date: string;
  duration_minutes: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  price: number;
  payment_status: "pending" | "paid" | "refunded";
  meeting_link?: string;
  note?: string;
}

export default function BookingsPage() {
  const { user, supabase } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [meetingLink, setMeetingLink] = useState("");
  const [note, setNote] = useState("");
  const router = useRouter();
  const [showMeetingFields, setShowMeetingFields] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("creator_id", user?.id)
        .order("booking_date", { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      toast.error("Failed to fetch bookings");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (id: string, status: Booking["status"]) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", id)
        .eq("creator_id", user?.id);

      if (error) throw error;

      toast.success("Booking status updated");
      fetchBookings();
    } catch (error) {
      toast.error("Failed to update booking status");
      console.error(error);
    }
  };

  const getStatusColor = (status: Booking["status"]) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const handleRequestPayment = async (bookingId: string) => {
    try {
      const { data, error } = await supabase.rpc("generate_payment_link", {
        booking_id: bookingId,
      });
      if (error) throw error;

      await fetch("/api/send-payment-link", {
        method: "POST",
        body: JSON.stringify({ bookingId, paymentUrl: data.payment_url, note }),
      });

      toast.success("Payment link sent 🎯");
    } catch (err) {
      toast.error("Failed to send payment request");
      console.error(err);
    }
  };

  const handleConfirm = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          status: "confirmed",
          meeting_link: meetingLink,
        })
        .eq("id", bookingId);

      if (error) throw error;

      await fetch("/api/send-meeting-link", {
        method: "POST",
        body: JSON.stringify({ bookingId, meetingLink, note }),
      });

      toast.success("Meeting link sent and booking confirmed 🚀");
    } catch (err) {
      toast.error("Failed to confirm");
      console.error(err);
    }
  };

  const handleCancel = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);

      if (error) throw error;

      toast.success("Booking cancelled 🛑");
    } catch (err) {
      toast.error("Failed to cancel booking");
      console.error(err);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Bookings</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your bookings and appointments
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-col">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Client
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Service
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Payment
                    </th>
                    <th
                      scope="col"
                      className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="font-medium text-gray-900">
                          {booking.client_name}
                        </div>
                        <div className="text-gray-500">
                          {booking.client_email}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="font-medium text-gray-900">
                          {booking.service_type}
                        </div>
                        <div className="text-gray-500">
                          {booking.duration_minutes} minutes
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {format(new Date(booking.booking_date), "PPp")}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(booking.status)}`}
                        >
                          {booking.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            booking.payment_status === "paid"
                              ? "bg-green-100 text-green-800"
                              : booking.payment_status === "refunded"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {booking.payment_status}
                        </span>
                      </td>
                      <td className="relative flex justify-center whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        {/* Manual Status Select */}
                        <Select
                          defaultValue={booking.status}
                          onValueChange={(value) =>
                            updateBookingStatus(
                              booking.id,
                              value as Booking["status"]
                            )
                          }
                          value={booking.status}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Manage Button */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <button className="text-blue-600 hover:text-blue-900 ml-4">
                              Manage
                            </button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Manage Booking</DialogTitle>
                              <DialogDescription className="text-sm text-gray-500">
                                Manage this booking quickly with the options
                                below.
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 mt-4">
                              {/* Payment Request */}
                              <Button
                                variant="outline"
                                className="w-full"
                                disabled={booking.payment_status === "paid"}
                                onClick={() => handleRequestPayment(booking.id)}
                              >
                                Request Payment
                              </Button>

                              {/* Toggle for Meeting Link + Note */}
                              <Collapsible
                                open={showMeetingFields}
                                onOpenChange={setShowMeetingFields}
                              >
                                <CollapsibleTrigger asChild>
                                  <Button variant="default" className="w-full">
                                    {showMeetingFields
                                      ? "Hide Meeting Link Input"
                                      : "Confirm & Send Meeting Link"}
                                  </Button>
                                </CollapsibleTrigger>

                                <CollapsibleContent className="space-y-4 mt-4">
                                  <Input
                                    placeholder="Enter meeting link"
                                    value={meetingLink}
                                    onChange={(e) =>
                                      setMeetingLink(e.target.value)
                                    }
                                  />

                                  <Textarea
                                    placeholder="Optional note to include in email..."
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                  />

                                  <Button
                                    variant="default"
                                    className="w-full"
                                    onClick={() => handleConfirm(booking.id)}
                                  >
                                    Send Meeting Link Now
                                  </Button>
                                </CollapsibleContent>
                              </Collapsible>

                              {/* Reschedule */}
                              <div className="flex justify-between space-x-2 mt-4">
                                <Button
                                  variant="secondary"
                                  onClick={() =>
                                    router.push(
                                      `/dashboard/bookings/${booking.id}/edit`
                                    )
                                  }
                                >
                                  Reschedule Booking
                                </Button>

                                {/* Cancel */}
                                <Button
                                  variant="destructive"
                                  onClick={() => handleCancel(booking.id)}
                                >
                                  Cancel Booking
                                </Button>
                              </div>
                            </div>

                            <DialogFooter className="pt-4">
                              <DialogClose asChild>
                                <Button
                                  onClick={() => {
                                    setMeetingLink("");
                                    setNote("");
                                    setShowMeetingFields(false);
                                  }}
                                  variant="ghost"
                                  type="button"
                                >
                                  Close
                                </Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {bookings.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No bookings found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Total Bookings
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {bookings.length}
            </dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Pending Bookings
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {bookings.filter((b) => b.status === "pending").length}
            </dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Completed Bookings
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {bookings.filter((b) => b.status === "completed").length}
            </dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Total Revenue
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              $
              {bookings
                .filter((b) => b.payment_status === "paid")
                .reduce((sum, booking) => sum + booking.price, 0)
                .toFixed(2)}
            </dd>
          </div>
        </div>
      </div>

      {/* Export/Filter Options */}
      <div className="mt-8 flex justify-end space-x-4">
        <button
          onClick={() => {
            // TODO: Implement export functionality
            toast.info("Export functionality coming soon");
          }}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Export
        </button>
        <button
          onClick={() => {
            // TODO: Implement filter functionality
            toast.info("Filter functionality coming soon");
          }}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Filter
        </button>
      </div>
    </div>
  );
}
