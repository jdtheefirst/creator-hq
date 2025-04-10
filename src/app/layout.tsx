import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/context/AuthContext";
import { StoreProvider } from "@/lib/context/StoreContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Creator HQ - Your Digital Hub",
  description:
    "A comprehensive platform for creators to showcase their work, sell products, and connect with their audience.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <StoreProvider>
            <main className="min-h-screen bg-white">{children}</main>
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
