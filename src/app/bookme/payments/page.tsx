import { CheckCircle, XCircle } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Payment Status - CreatorHQ",
};

export default async function PaymentStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const isSuccess = status === "success";
  const isCancelled = status === "cancelled";

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-24">
      <div className="text-center max-w-xl">
        <div className="flex justify-center mb-6">
          <div className="animate-bounce-slow">
            {isSuccess ? (
              <CheckCircle className="w-20 h-20 text-green-500 animate-pop" />
            ) : isCancelled ? (
              <XCircle className="w-20 h-20 text-red-500 animate-pop" />
            ) : null}
          </div>
        </div>

        <h1 className="text-3xl font-semibold mb-2">
          {isSuccess
            ? "Payment Successful! 🎉"
            : isCancelled
              ? "Payment Cancelled 😕"
              : "Status Unknown"}
        </h1>

        <p className="text-gray-600 max-w-xl mb-4">
          {isSuccess
            ? "Thanks for completing your payment. You'll receive a confirmation email with next steps shortly."
            : isCancelled
              ? "Looks like the payment was cancelled. You can always try again or reach out for help."
              : "We couldn't determine the payment status. Please contact support."}
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
          <Link
            href="/bookme"
            className="inline-block px-6 py-3 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
          >
            Back to Booking
          </Link>
          <Link
            href="/"
            className="inline-block px-6 py-3 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
