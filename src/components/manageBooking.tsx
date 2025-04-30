"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { CalendarIcon, Copy, Notebook } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";

import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "@/lib/utils";
import { Calendar } from "./ui/calendar";
import { useAuth } from "@/lib/context/AuthContext";
import { Textarea } from "./ui/textarea";
import { useRouter } from "next/navigation";

interface BookingProps {
  booking?: {
    id: string;
    client_name: string;
    client_email: string;
    phone?: string;
    service_type: "consultation" | "workshop" | "mentoring" | "other";
    booking_date: string;
    booking_time: string;
    duration_minutes: number;
    status: "pending" | "confirmed" | "completed" | "cancelled";
    price: number;
    currency: string;
    payment_status: "pending" | "paid" | "refunded";
    meeting_link?: string;
    notes?: string;
  };
}

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export function formatDateWithOrdinal(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate();
  const monthYear = format(date, "MMMM yyyy");

  // Get ordinal suffix
  const ordinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  return `${day}${ordinal(day)} ${monthYear}`;
}

export function ManageBooking({ booking }: BookingProps) {
  const { supabase, user } = useAuth();
  const [date, setDate] = React.useState<Date>();
  const [note, setNote] = useState<string>("");
  const router = useRouter();

  const formattedDate = booking?.booking_date
    ? formatDateWithOrdinal(booking.booking_date)
    : "Date not available";

  async function handleSave(id: string | undefined, newTime: Date | null) {
    if (!id || !newTime) {
      toast.error("Booking ID or new time is missing.");
      return;
    }

    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          booking_date: newTime.toISOString(),
          notes: note,
        })
        .eq("id", id)
        .eq("creator_id", user?.id)
        .single();

      if (error) {
        throw new Error("Failed to update booking.", error);
      }

      toast.success("Booking date updated successfully!");
      router.back();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update booking date.");
    }
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h2 className="text-2xl font-bold">{booking?.client_name}</h2>
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground">{booking?.client_email}</p>
          <button
            onClick={() => {
              if (booking?.client_email) {
                navigator.clipboard.writeText(booking.client_email);
                toast.success("Email copied to clipboard!");
              }
            }}
            className="flex items-center gap-1"
          >
            <Copy className="w-4 h-4" />
            Copy
          </button>
        </div>
        {booking?.notes && (
          <div className="flex items-center gap-2">
            <Notebook />
            <p className="text-sm text-muted-foreground">"{booking?.notes}"</p>
          </div>
        )}
        {booking?.phone && (
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">Phone:</p>
            <p className="text-muted-foreground">{booking.phone}</p>
            <button
              onClick={() => {
                if (booking?.phone) {
                  navigator.clipboard.writeText(booking.phone);
                  toast.success("Phone number copied to clipboard!");
                }
              }}
              className="flex items-center gap-1"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-2">
        <p>
          <strong>Service:</strong> {booking?.service_type}
        </p>
        <p>
          <strong>Date:</strong> {formattedDate}
        </p>
        <p>
          <strong>Start:</strong> {booking?.booking_time} hrs
        </p>
        <p>
          <strong>Duration:</strong> {booking?.duration_minutes} min
        </p>
        <p>
          <strong>Price:</strong> ${booking?.price} {booking?.currency}
        </p>
        {booking?.meeting_link && (
          <div className="flex items-center gap-2">
            <p>
              <strong>Meeting Link:</strong>{" "}
              <a
                href={booking?.meeting_link}
                target="_blank"
                className="underline"
              >
                {booking.meeting_link}
              </a>
            </p>
            <button
              onClick={() => {
                if (booking?.meeting_link) {
                  navigator.clipboard.writeText(booking.meeting_link);
                  toast.success("Meeting link copied to clipboard!");
                }
              }}
              className="flex items-center gap-1"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-2">
        <p>
          <strong>Status:</strong> {booking?.status}
        </p>
        <p>
          <strong>Payment:</strong> {booking?.payment_status}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[280px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
              size="sm"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? (
                format(date, "PPP")
              ) : (
                <span>Pick a date to reschedule to</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      <div>
        <label htmlFor="note" className="block text-sm font-medium mb-1">
          Optional message to client
        </label>
        <Textarea
          id="note"
          placeholder="Let the client know why you're rescheduling..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button
          variant={"default"}
          size="sm"
          onClick={() => {
            handleSave(booking?.id, date!);
          }}
          className="w-[280px]"
        >
          Save
        </Button>
      </div>
    </div>
  );
}
