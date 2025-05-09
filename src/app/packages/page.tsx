import CountdownTimerWrapper from "@/components/countdownWrapper";
import { Clock, BadgeCheck, Flame } from "lucide-react";
import Link from "next/link";

export default function PackagesPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white px-6 py-16">
      <section className="max-w-5xl mx-auto text-center">
        <div className="flex justify-center items-center gap-2 mb-4">
          <Flame className="text-yellow-400 w-6 h-6 animate-pulse" />
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Lock In Your Personal CreatorHQ Site
          </h2>
          <Flame className="text-yellow-400 w-6 h-6 animate-pulse" />
        </div>
        <p className="text-gray-400 mb-12">
          No noise, no fluff. Just your own digital HQ. Built once, owned
          forever.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* One-time Package */}
          <div className="relative border border-gray-700 rounded-2xl p-8 bg-gray-900 hover:border-yellow-400 transition shadow-md">
            <span className="absolute top-0 right-0 bg-yellow-400 text-black px-3 py-1 text-xs font-bold rounded-bl-xl rounded-tr-xl">
              🔥 Selling Fast
            </span>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <BadgeCheck className="text-yellow-400" /> Lifetime Site (One-Off)
            </h2>
            <p className="text-gray-400 mb-4">
              One setup. Yours for life. Custom domain. Fully deployed.
            </p>
            <ul className="text-sm text-left mb-6 space-y-2">
              <li>✅ Fully branded CreatorHQ site</li>
              <li>✅ Music, videos, blogs, store, VIP & more</li>
              <li>✅ Hosted + custom domain</li>
              <li>✅ Custom payment integrations</li>
              <li>✅ Zero monthly fees, one-time unlock</li>
            </ul>
            <div className="text-3xl font-bold text-yellow-400 mb-4">$100</div>
            <Link
              href="https://www.upwork.com/services/product/development-it-one-time-creator-site-fully-branded-custom-domain-lifetime-ownership-1920823450162886041?ref=project_share"
              passHref
            >
              <span className="inline-block bg-yellow-400 text-black font-semibold px-6 py-2 rounded-xl hover:bg-yellow-300 transition cursor-pointer">
                Claim This Slot
              </span>
            </Link>
            <p className="text-gray-400 text-sm mt-4">
              CreatorHQ Monthly drops in <CountdownTimerWrapper />. After that,
              this one-time offer is gone for good.
            </p>
          </div>

          {/* Monthly Plan Placeholder */}
          <div className="relative border border-gray-800 rounded-2xl p-8 bg-gray-800 opacity-60 hover:opacity-80 transition shadow-md">
            <span className="absolute top-0 right-0 bg-gray-700 text-white px-3 py-1 text-xs font-bold rounded-bl-xl rounded-tr-xl">
              ⏳ Waitlist Soon
            </span>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Clock className="text-gray-400" /> CreatorHQ Monthly (Coming
              Soon)
            </h2>
            <p className="text-gray-400 mb-4">
              A subscription for serious creators. More features, less hassle.
            </p>
            <ul className="text-sm text-left mb-6 space-y-2 text-gray-400">
              <li>🕒 Auto updates + new modules</li>
              <li>🕒 Dashboards, analytics & insights</li>
              <li>🕒 Built-in Stripe payouts</li>
              <li>🕒 Monetization tools ready</li>
              <li>🕒 Priority support</li>
            </ul>
            <div className="text-xl text-gray-400 mb-4">
              Launching in{" "}
              <span className="font-semibold text-white">May 2025</span>
            </div>
            <Link
              href={"/waitlist"}
              className="inline-block bg-yellow-400 text-black font-semibold px-6 py-2 rounded-xl hover:bg-yellow-300 transition cursor-pointer"
            >
              Join Waitlist
            </Link>
          </div>
        </div>

        <p className="mt-12 text-sm text-gray-500">
          Want something custom or got questions? DM me on{" "}
          <a
            href="https://x.com/jdtheefirst"
            rel="noopener"
            className="underline"
          >
            X
          </a>{" "}
          or hit me up on{" "}
          <a
            href="https://www.upwork.com/freelancers/jdtheefirst"
            className="underline"
            rel="noopener"
          >
            Upwork
          </a>
          .
        </p>
      </section>
    </main>
  );
}
