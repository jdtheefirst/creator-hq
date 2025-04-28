"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { CalendarIcon, Copy } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";

import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "@/lib/utils";
import { Calendar } from "./ui/calendar";

interface BookingProps {
  booking?: {
    id: string;
    client_name: string;
    client_email: string;
    service_type: "consultation" | "workshop" | "mentoring" | "other";
    booking_date: string;
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

export function ManageBooking({ booking }: BookingProps) {
  const [newTime, setNewTime] = useState<Date | null>(
    booking?.booking_date ? new Date(booking.booking_date) : null
  );
  const [date, setDate] = React.useState<Date>();

  const formattedDate = booking?.booking_date
    ? format(new Date(booking.booking_date), "PPPP p")
    : "Date not available";

  async function handleSave(id: string | undefined, newTime: Date | null) {
    if (!id || !newTime) {
      toast.error("Booking ID or new time is missing.");
      return;
    }

    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ booking_date: newTime.toISOString() }),
      });

      if (!response.ok) {
        throw new Error("Failed to update booking.");
      }

      toast.success("Booking date updated successfully!");
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
      </div>

      <div className="grid gap-2">
        <p>
          <strong>Service:</strong> {booking?.service_type}
        </p>
        <p>
          <strong>Date:</strong> {formattedDate}
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
                !newTime && "text-muted-foreground"
              )}
              size="sm"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {newTime ? format(newTime, "PPP") : <span>Pick a date</span>}
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

        <Button
          variant={"default"}
          onClick={() => {
            handleSave(booking?.id, newTime);
          }}
          className="w-[280px]"
        >
          Save
        </Button>
      </div>
    </div>
  );
}
