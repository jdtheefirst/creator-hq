import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import BookingForm from "@/components/BookingForm";

interface EditBookingPageProps {
  params: {
    id: string;
  };
}

export default async function EditBookingPage({
  params,
}: EditBookingPageProps) {
  const supabase = createServerComponentClient({ cookies });

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !booking) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8">Edit Booking</h1>
        <BookingForm booking={booking} />
      </div>
    </div>
  );
}
