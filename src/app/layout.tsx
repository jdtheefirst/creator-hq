import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/context/AuthContext";
import { StoreProvider } from "@/lib/context/StoreContext";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });
const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const coverUrl = `${projectUrl}/storage/v1/object/public/covers/57d7577e-ab4f-474a-bd0f-030e5bf41b5f/cover.png`;

export const metadata: Metadata = {
  title: "Creator HQ - Your Digital Hub",
  description:
    "A comprehensive platform for creators to showcase their work, sell products, and connect with their audience.",
  metadataBase: new URL("https://www.worldsamma.org"),
  openGraph: {
    title: "Creator HQ - Your Digital Hub",
    description:
      "A comprehensive platform for creators to showcase their work, sell products, and connect with their audience.",
    url: "https://www.worldsamma.org",
    siteName: "Creator HQ",
    images: [
      {
        url: coverUrl,
        width: 1200,
        height: 630,
        alt: "Creator HQ Platform Cover",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Creator HQ - Your Digital Hub",
    description:
      "A comprehensive platform for creators to showcase their work, sell products, and connect with their audience.",
    images: [coverUrl],
    creator: "@creatorhq",
  },
  alternates: {
    canonical: "https://www.worldsamma.org",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Favicon links */}
        {/* Basic favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />

        {/* Modern browsers */}
        <link
          rel="icon"
          href="/favicon-32x32.png"
          type="image/png"
          sizes="32x32"
        />
        <link
          rel="icon"
          href="/favicon-16x16.png"
          type="image/png"
          sizes="16x16"
        />

        {/* Apple Touch Icon */}
        <link
          rel="apple-touch-icon"
          href="/apple-touch-icon.png"
          type="image/png"
          sizes="180x180"
        />

        {/* Android Chrome */}
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <StoreProvider>
            <main className="min-h-screen bg-white">
              {children}
              <Toaster position="top-right" richColors closeButton />
            </main>
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
