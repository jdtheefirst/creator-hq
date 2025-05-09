import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "Session Details",
  description: "Detailed session insights are locked for one-off clients.",
};

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // You could optionally check if id exists just to show a different msg
  if (!id) notFound();

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="bg-white p-6 rounded-xl shadow-md border text-center">
        <Lock className="mx-auto text-gray-500 mb-4" size={36} />
        <h2 className="text-2xl font-bold mb-2">Session Locked</h2>
        <p className="text-muted-foreground mb-4">
          The session ID{" "}
          <code className="text-sm text-black bg-gray-100 px-2 py-1 rounded">
            {id}
          </code>{" "}
          exists, but full details are available only to recurring clients.
        </p>
        <Link
          href="https://www.upwork.com/freelancers/jdtheefirst"
          className="inline-block bg-yellow-400 text-black px-4 py-2 rounded-full font-semibold hover:bg-yellow-300 transition"
        >
          Upgrade access
        </Link>
      </div>
    </div>
  );
}
