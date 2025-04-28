import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ManageBooking } from "@/components/manageBooking";

interface EditBookingPageProps {
  params: {
    id: string;
  };
}

export default async function EditBookingPage({
  params,
}: EditBookingPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  const { id } = await params;

  console.log("Booking ID:", id, "User ID:", user?.id);

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .eq("creator_id", user?.id)
    .single();

  if (error || !booking) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Reschedule Booking</h1>
        <ManageBooking booking={booking} />
      </div>
    </div>
  );
}
