import PublicBookingForm from "@/components/clientBookingForm";

export default async function NewBookingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8">New Booking</h1>
        <PublicBookingForm />
      </div>
    </div>
  );
}
