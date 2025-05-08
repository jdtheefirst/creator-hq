import { Metadata } from "next";
import Link from "next/link";
import { BarChart2, Mail, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Advanced Analytics Reports",
  description:
    "Detailed analytics reports are available for recurring clients.",
};

export default function ReportsPage() {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="bg-white p-8 rounded-xl shadow-md border text-center">
        <div className="inline-flex items-center justify-center p-4 bg-blue-100 rounded-full mb-6">
          <BarChart2 className="text-blue-600" size={36} />
        </div>

        <h2 className="text-2xl font-bold mb-4">Advanced Reports Unlocked</h2>

        <div className="space-y-4 mb-6 text-left">
          <p className="text-muted-foreground">
            You're currently on a one-off package which includes core analytics.
            Our recurring clients gain access to:
          </p>

          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <Zap className="flex-shrink-0 text-green-500 mt-1" size={18} />
              <span>Custom report generation</span>
            </li>
            <li className="flex items-start gap-3">
              <Zap className="flex-shrink-0 text-green-500 mt-1" size={18} />
              <span>Historical data comparisons</span>
            </li>
            <li className="flex items-start gap-3">
              <Zap className="flex-shrink-0 text-green-500 mt-1" size={18} />
              <span>Exportable CSV/PDF reports</span>
            </li>
            <li className="flex items-start gap-3">
              <Zap className="flex-shrink-0 text-green-500 mt-1" size={18} />
              <span>Automated weekly insights</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Link
            href="https://www.upwork.com/freelancers/jdtheefirst"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-600 transition-all"
          >
            Upgrade to Recurring
          </Link>

          <Link
            href="mailto:jngatia@gmail.com"
            className="inline-flex items-center justify-center gap-2 border border-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-all"
          >
            <Mail size={18} />
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
