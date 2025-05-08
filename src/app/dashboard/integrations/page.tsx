import { Metadata } from "next";
import Link from "next/link";
import {
  CreditCard,
  Share2,
  DollarSign,
  Lock,
  Mail,
  Zap,
  Youtube,
  Instagram,
  Twitter,
  Twitch,
  ArrowRight,
} from "lucide-react";

import { FaTiktok } from "react-icons/fa";
import { CiFacebook, CiLinkedin } from "react-icons/ci";
import { FcGoogle } from "react-icons/fc";

export const metadata: Metadata = {
  title: "Platform Integrations",
  description:
    "Connect CreatorHQ with your other platforms and payment methods",
};

export default function IntegrationsPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="bg-white p-8 rounded-xl shadow-md border">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 bg-purple-100 rounded-full mb-6">
            <Share2 className="text-purple-600" size={36} />
          </div>

          <h2 className="text-2xl font-bold mb-2">Supercharge Your Workflow</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Recurring clients unlock powerful integrations to automate payments,
            sync content, and maximize earnings across platforms.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Payment Integrations */}
          <div className="border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="text-blue-500" size={24} />
              <h3 className="font-semibold text-lg">Payment Methods</h3>
              <Lock className="ml-auto text-gray-400" size={18} />
            </div>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-center gap-2">
                <Zap className="text-green-500" size={16} />
                Connect bank accounts for automatic disbursements
              </li>
              <li className="flex items-center gap-2">
                <Zap className="text-green-500" size={16} />
                Set up PayPal, Stripe, or Wise transfers
              </li>
              <li className="flex items-center gap-2">
                <Zap className="text-green-500" size={16} />
                Schedule recurring payouts
              </li>
            </ul>
          </div>

          {/* Social Integrations */}
          <div className="border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Share2 className="text-pink-500" size={24} />
              <h3 className="font-semibold text-lg">Social Platforms</h3>
              <Lock className="ml-auto text-gray-400" size={18} />
            </div>
            <div className="flex flex-wrap gap-3 mb-4">
              {[
                Youtube,
                Instagram,
                Twitter,
                Twitch,
                FaTiktok,
                CiFacebook,
                CiLinkedin,
              ].map((Icon, i) => (
                <div key={i} className="p-2 border rounded-full">
                  <Icon className="text-gray-700" size={18} />
                </div>
              ))}
            </div>
            <p className="text-muted-foreground">
              Auto-post content and sync analytics from all connected platforms
            </p>
          </div>

          {/* Ad Networks */}
          <div className="border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="text-yellow-500" size={24} />
              <h3 className="font-semibold text-lg">Ad Networks</h3>
              <Lock className="ml-auto text-gray-400" size={18} />
            </div>
            <div className="flex items-center gap-3 mb-3">
              <FcGoogle className="text-gray-700" size={20} />

              <span className="text-muted-foreground">Google AdSense</span>
            </div>
            <p className="text-muted-foreground">
              Connect preferred ad providers and manage placements
            </p>
          </div>

          {/* Custom Requests */}
          <div className="border rounded-lg p-6 bg-gray-50">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="text-purple-500" size={24} />
              <h3 className="font-semibold text-lg">Need Something Else?</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              We can build custom integrations for your unique workflow needs.
            </p>
            <Link
              href="mailto:integrations@creatorhq.com?subject=Custom Integration Request"
              className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 font-medium"
            >
              Request Integration <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="text-center border-t pt-8">
          <h3 className="text-xl font-semibold mb-4">
            Ready to Unlock Integrations?
          </h3>
          <Link
            href="https://www.upwork.com/freelancers/jdtheefirst"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-600 transition-all"
          >
            Upgrade to Recurring Plan
          </Link>
        </div>
      </div>
    </div>
  );
}
