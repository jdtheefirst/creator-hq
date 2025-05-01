import Link from "next/link";
import { format } from "date-fns";
import NewsletterForm from "@/components/NewsletterForm";

const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

interface AvailabilitySlot {
  day_of_week: number; // 0 for Sunday, 1 for Monday, etc.
  start_time: string; // e.g., "09:00"
  end_time: string; // e.g., "17:00"
}

export default async function BookingLanding() {
  const creatorId = process.env.NEXT_PUBLIC_CREATOR_UID;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const res = await fetch(
    `${siteUrl}/api/creator/booking-info?creatorId=${creatorId}`,
    {
      cache: "no-store",
    }
  );
  const { availability, blockedDates, bookings } = await res.json();

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="max-w-2xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">📅 Booking Info</h1>
            <p className="text-sm text-gray-600">
              Plan your slot based on the availability below
            </p>
          </div>

          {/* Availability */}
          <div>
            <h2 className="text-xl font-semibold mb-1">
              Available Weekly Hours
            </h2>
            <div className="space-y-1 text-gray-700 text-sm">
              {availability?.length ? (
                availability.map((slot: AvailabilitySlot) => (
                  <p key={slot.day_of_week}>
                    {daysOfWeek[slot.day_of_week]}:{" "}
                    {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                  </p>
                ))
              ) : (
                <div className="text-gray-700 space-y-2">
                  <p className="text-red-500 font-semibold">
                    This creator hasn’t opened up their calendar yet.
                  </p>
                  <p>
                    But don’t bounce! This just means the next booking window is
                    cooking.{" "}
                    <span className="font-medium">Check back soon</span> or
                    follow their socials for real-time updates.
                  </p>
                  <p className="text-sm text-gray-500 italic">
                    ⚠️ Need to lock in something urgent? DM them directly — they
                    might open a hidden slot for you.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Blocked Dates */}
          {blockedDates && blockedDates?.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-1">⛔ Blocked Dates</h2>
              <ul className="text-sm text-gray-700 list-disc pl-5">
                {blockedDates.map(
                  (
                    b: {
                      start_date: string;
                      end_date: string;
                      reason?: string;
                    },
                    i: number
                  ) => (
                    <li key={i}>
                      {format(new Date(b.start_date), "MMM d")} -{" "}
                      {format(new Date(b.end_date), "MMM d")}:{" "}
                      {b.reason || "Unavailable"}
                    </li>
                  )
                )}
              </ul>
            </div>
          )}

          {/* Upcoming Bookings */}
          {bookings && bookings?.length > 0 && (
            <div className="max-h-sm my-auto">
              <h2 className="text-xl font-semibold mb-1">
                🗓 Upcoming Bookings
              </h2>
              <ul className="text-sm text-gray-800 space-y-1">
                {bookings.map(
                  (
                    b: {
                      booking_date: string;
                      client_name: string;
                      status: string;
                    },
                    i: number
                  ) => (
                    <li
                      key={i}
                      className="flex justify-between items-center border-b pb-1"
                    >
                      <span>
                        {format(new Date(b.booking_date), "PPpp")} •{" "}
                        {b.client_name}
                      </span>
                      <span className="text-xs text-gray-500">{b.status}</span>
                    </li>
                  )
                )}
              </ul>
            </div>
          )}

          {/* CTA */}
          <div className="flex text-center justify-between pt-6">
            <a
              href="/bookme"
              className="inline-block px-6 py-3 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
            >
              Back to Homepage
            </a>
            <Link
              href="/bookme/new"
              className="inline-block bg-blue-600 text-white px-6 py-2 font-medium rounded-lg hover:bg-blue-700 transition"
            >
              Book a Slot
            </Link>
          </div>
        </div>
        <div className="bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Stay Updated
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                Subscribe to my newsletter to get the latest updates, exclusive
                content, and behind-the-scenes insights.
              </p>
              <NewsletterForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
