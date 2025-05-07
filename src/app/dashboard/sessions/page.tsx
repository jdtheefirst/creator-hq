import { Metadata } from "next";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Checkout Sessions",
  description: "This feature is part of the premium recurring plan.",
};

export default async function SessionsPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="bg-white p-6 rounded-xl shadow-md border">
        <div className="flex items-start gap-4 mb-4">
          <AlertCircle className="text-yellow-500 mt-1" size={24} />
          <div>
            <h2 className="text-2xl font-bold mb-1">Not in your plan</h2>
            <p className="text-muted-foreground">
              Checkout session insights are only available to recurring clients.
              Your one-time license keeps things simple, but not this simple.
            </p>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="mb-4 text-sm text-gray-500">
            Want to upgrade and unlock session tracking, analytics, and more?
          </p>
          <Link
            href="https://www.upwork.com/freelancers/jdtheefirst"
            className="inline-block bg-black text-white px-5 py-2 rounded-full font-semibold hover:bg-gray-900 transition"
          >
            Reach out to upgrade
          </Link>
        </div>
      </div>
    </div>
  );
}
