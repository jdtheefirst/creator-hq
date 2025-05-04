import { X } from "lucide-react";

export default function Cancel() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50 px-4">
      <div className="max-w-md text-center bg-white p-6 rounded-2xl shadow-md">
        <div className="flex justify-center mb-6">
          <div className="animate-bounce-slow">
            <X className="w-16 h-16 text-green-500 animate-pop" />
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-4">Cancelled!</h1>
        <p className="text-lg">
          Cancelled. Please try again or contact support if you need help.
        </p>
        <a
          href="/vip"
          className="inline-block bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition mt-4"
        >
          Return to Vip
        </a>
      </div>
    </div>
  );
}
