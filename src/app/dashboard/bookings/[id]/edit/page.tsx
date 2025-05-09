import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ManageBooking } from "@/components/manageBooking";

export default async function EditBookingPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { id } = params;

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
        <div className="mb-8 gap-2 flex flex-col">
          <h1 className="text-4xl font-bold">Reschedule Booking</h1>
          <p className="text-sm text-muted-foreground mb-2">
            Clients will automatically be notified by email when you reschedule.
            <br />
            <span className="text-red-500 font-medium">
              This feature is not available in your current plan.
            </span>{" "}
            You can{" "}
            <a
              href="mailto:jngatia045@gmail.com?subject=Upgrade%20Request%20for%20Email%20Notifications&body=Hey%20team%2C%20I'd%20like%20to%20enable%20automated%20client%20email%20notifications%20when%20I%20reschedule%20bookings.%20Please%20let%20me%20know%20how%20to%20upgrade."
              className="underline text-blue-600"
              target="_blank"
              rel="noopener noreferrer"
            >
              contact support
            </a>{" "}
            to enable this feature.
          </p>
        </div>
        <ManageBooking booking={booking} />
      </div>
    </div>
  );
}
