import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | Joe Doe’s Creator HQ",
  description:
    "Sign in to Joe Doe's Creator HQ – your personalized space for content creation, collaboration, and growth.",
  openGraph: {
    title: "Login | Joe Doe’s Creator HQ",
    description:
      "Join Joe Doe's Creator HQ and take your content creation to the next level.",
    url: "https://yourwebsite.com/login",
    siteName: "Joe Doe's Creator HQ",
    images: [
      {
        url: "https://yourwebsite.com/images/creator-hq-banner.jpg",
        width: 1200,
        height: 630,
        alt: "Joe Doe’s Creator HQ",
      },
    ],
    type: "website",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">
              Joe Doe’s Creator HQ
            </h1>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
