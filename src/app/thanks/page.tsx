import { CheckCircle } from "lucide-react";

export default function ThanksPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-15">
      <div className="text-center max-w-xl">
        <div className="flex justify-center mb-6">
          <div className="animate-bounce-slow">
            <CheckCircle className="w-16 h-16 text-green-500 animate-pop" />
          </div>
        </div>

        <h1 className="text-2xl font-semibold py-2">Booking Received!</h1>
        <p className="text-gray-600 max-w-xl">
          Thank you for your request. I’ll get back to you shortly to confirm or
          reschedule if needed. Once confirmed and payment is completed, a
          meeting link will be emailed to you.
        </p>
        <p className="text-sm text-gray-500 py-4">
          Be on the lookout for an email from me. Make sure to check your spam
          folder too!
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <a
            href="/bookme"
            className="inline-block px-6 py-3 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
          >
            Back to Booking
          </a>
          <a
            href="/"
            className="inline-block px-6 py-3 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    </div>
  );
}
