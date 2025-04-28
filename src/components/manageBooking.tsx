"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { format } from "date-fns";
import { toast } from "sonner";
import { CalendarIcon, Copy, Loader2 } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
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
  const [openEdit, setOpenEdit] = useState(false);
  const [openReschedule, setOpenReschedule] = useState(false);
  const [newTime, setNewTime] = useState<Date | null>(
    booking?.booking_date ? new Date(booking.booking_date) : null
  );
  const [date, setDate] = React.useState<Date>();
  const [meetingLink, setMeetingLink] = useState(booking?.meeting_link || "");

  const formattedDate = booking?.booking_date
    ? format(new Date(booking.booking_date), "PPPP p")
    : "Date not available";

  async function handleStatusUpdate(bookingId: string, newStatus: string) {
    try {
      // Call your API endpoint here
      console.log("Updating status...", bookingId, newStatus);
      // toast.success('Status updated!');
    } catch (err) {
      console.error(err);
      // toast.error('Failed to update status.');
    }
  }

  async function handleRequestPayment(bookingId: string) {
    try {
      // Trigger payment request API here
      console.log("Requesting payment...", bookingId);
      // toast.success('Payment link sent!');
    } catch (err) {
      console.error(err);
      // toast.error('Failed to request payment.');
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
        <Dialog open={openEdit} onOpenChange={setOpenEdit}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Edit Details
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Booking Details</DialogTitle>
              <DialogDescription>
                Update the booking details below.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <Label htmlFor="meetingLink">Meeting Link</Label>
              <Input
                id="meetingLink"
                type="url"
                placeholder="https://your-meeting-link.com"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              Save
            </Button>
          </DialogContent>
        </Dialog>

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
          variant="outline"
          size="sm"
          onClick={() => handleStatusUpdate(booking?.id!, "completed")}
        >
          Mark as Completed
        </Button>

        {booking?.payment_status === "pending" && (
          <Button size="sm" onClick={() => handleRequestPayment(booking.id)}>
            Request Payment
          </Button>
        )}
      </div>
    </div>
  );
}
