import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import BookingForm from "@/components/BookingForm";

export default async function NewBookingPage() {
  const supabase = createServerComponentClient({ cookies });

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8">New Booking</h1>
        <BookingForm />
      </div>
    </div>
  );
}
